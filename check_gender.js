const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    const r = await c.query("SELECT count(*) FROM profiles WHERE gender IS NOT NULL");
    console.log('Profiles with Gender:', r.rows[0].count);
    
    const r2 = await c.query("SELECT gender, count(*) FROM profiles WHERE gender IS NOT NULL GROUP BY gender");
    console.log('Gender Distribution:', r2.rows);

    await c.end();
}
check();
