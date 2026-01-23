const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const c = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
    const [dupes] = await c.query('SELECT email, count(*) as count FROM users WHERE email IS NOT NULL AND email != "" GROUP BY email HAVING count > 1');
    console.log('Duplicate emails in users:', dupes);
    await c.end();
}
check();
