const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const mysqlConn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    const pgClient = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pgClient.connect();

    const targets = ['Fauzi', 'SYAHBUDIN RAHIM', 'Dedeh Suryati', 'DEWI NGAISAH'];

    for (const name of targets) {
        process.stdout.write(`\n--- Checking: ${name} ---\n`);
        
        // 1. MySQL: Find univ_id
        const [u_prof] = await mysqlConn.query(`
            SELECT p.univ_id 
            FROM profiles p 
            JOIN users u ON p.user_id = u.id 
            WHERE u.name = ?`, [name]);
        
        if (u_prof.length > 0) {
            const univId = u_prof[0].univ_id;
            const [univName] = await mysqlConn.query('SELECT name FROM universities WHERE id = ?', [univId]);
            process.stdout.write(`University: ${univName[0]?.name || 'Unknown (ID: ' + univId + ')'}\n`);
        } else {
            process.stdout.write(`User not found in MySQL profiles.\n`);
        }

        // 2. PG: Check if their participant status has monthly reports
        const { rows: partMatches } = await pgClient.query(`
            SELECT count(mr.id) as count 
            FROM participants p 
            JOIN profiles pr ON p.profile_id = pr.id 
            JOIN users u ON pr.user_id = u.id 
            LEFT JOIN monthly_reports mr ON p.id = mr.participant_id
            WHERE u.username = $1`, [name]);

        if (partMatches.length > 0) {
            process.stdout.write(`Monthly Reports Count: ${partMatches[0].count}\n`);
        }
    }

    await mysqlConn.end();
    await pgClient.end();
}
check();
