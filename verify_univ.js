const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    
    console.log('--- University Migration Verification (Postgres) ---');
    
    const uCount = await c.query("SELECT count(*) FROM universities");
    console.log('Total Universities:', uCount.rows[0].count);

    const pCount = await c.query("SELECT count(*) FROM profiles WHERE university_id IS NOT NULL");
    console.log('Profiles with University:', pCount.rows[0].count);

    const sample = await c.query(`
        SELECT pr.full_name, u.name as univ_name
        FROM profiles pr
        JOIN universities u ON pr.university_id = u.id
        LIMIT 5
    `);
    console.log('\nSample Profiles with University:');
    console.table(sample.rows);

    await c.end();
}
check();
