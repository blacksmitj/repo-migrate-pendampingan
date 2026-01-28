const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const mysqlConn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
    try {
        const [rows] = await mysqlConn.query('SELECT COUNT(*) as count FROM logbook_harian');
        console.log('Total Logbooks:', rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        await mysqlConn.end();
    }
}
check();
