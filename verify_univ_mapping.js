const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const pg = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pg.connect();

    const { rows } = await pg.query(`
        SELECT count(*) as count 
        FROM participants 
        WHERE university_id IS NOT NULL
    `);
    console.log('Participants with University Pendamping:', rows[0].count);

    const { rows: sample } = await pg.query(`
        SELECT p.legacy_tkm_id, u.name as university_name
        FROM participants p
        JOIN universities u ON p.university_id = u.id
        LIMIT 5
    `);
    console.log('\nSample mapping:');
    sample.forEach(s => console.log(`ID TKM: ${s.legacy_tkm_id} -> Univ: ${s.university_name}`));

    await pg.end();
}
check();
