const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    
    console.log('--- Education Levels in New DB ---');
    const r = await c.query("SELECT last_education, count(*) FROM participants GROUP BY last_education ORDER BY count DESC");
    console.table(r.rows);

    await c.end();
}
check();
