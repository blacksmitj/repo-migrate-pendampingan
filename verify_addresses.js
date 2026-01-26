const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await client.connect();

    console.log('--- Verifying Address Names ---');
    const res = await client.query(`
        SELECT id, label, province_name, regency_name, district_name, province_id 
        FROM addresses 
        WHERE province_name IS NOT NULL 
        LIMIT 10
    `);

    console.log(`Found ${res.rowCount} addresses with names.`);
    if (res.rowCount > 0) {
        console.table(res.rows);
    } else {
        console.log("No addresses found with province_name populated!");
    }
    
    // Check for potential fallback usage (where ID is null but Name is present)
    const badData = await client.query(`
        SELECT count(*) as count 
        FROM addresses 
        WHERE province_id IS NULL AND province_name IS NOT NULL
    `);
    console.log(`Addresses with Name but NO ID (Fallback used): ${badData.rows[0].count}`);

    await client.end();
}
check();
