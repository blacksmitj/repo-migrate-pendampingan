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
        
        const [tables] = await c.query("SHOW TABLES LIKE '%univ%'");
        console.log('Tables matching univ:', tables);
        
        const [universities] = await c.query("SELECT * FROM universities LIMIT 5");
        console.log('\nSample Universities:', universities);
        
        const [profiles] = await c.query("SELECT count(*) as count FROM profiles WHERE univ_id IS NOT NULL");
        console.log('\nProfiles with univ_id:', profiles[0].count);

        await c.end();
    } catch (e) {
        console.error(e);
    }
}
main();
