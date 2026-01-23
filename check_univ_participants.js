const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    try {
        const c = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        
        console.log('--- University Data Check (Legacy) ---');
        
        // 1. Mentors with University
        const [mentors] = await c.query(`
            SELECT count(*) as count 
            FROM profiles pr 
            JOIN users u ON pr.user_id = u.id 
            WHERE pr.univ_id IS NOT NULL
        `);
        console.log('Mentors (Users) with univ_id:', mentors[0].count);

        // 2. Participants with University (via NIK join to Profile)
        const [participants] = await c.query(`
            SELECT count(*) as count 
            FROM peserta p
            JOIN profiles pr ON p.nik = pr.nik
            WHERE pr.univ_id IS NOT NULL
        `);
        console.log('Participants (TKM) with univ_id in their Profile:', participants[0].count);

        await c.end();
    } catch (e) {
        console.error(e);
    }
}
main();
