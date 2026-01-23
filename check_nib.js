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
    
    // Total businesses
    const r1 = await pg.query('SELECT count(*) as total FROM businesses');
    console.log('Total Businesses:', r1.rows[0].total);
    
    // Businesses with NIB number filled
    const r2 = await pg.query("SELECT count(*) as total FROM businesses WHERE nib_number IS NOT NULL AND nib_number != ''");
    console.log('Businesses with NIB Number:', r2.rows[0].total);
    
    // Businesses with NIB document
    const r3 = await pg.query("SELECT count(DISTINCT b.id) as total FROM businesses b JOIN documents d ON d.entity_id = b.id AND d.entity_type = 'business' AND d.label = 'NIB'");
    console.log('Businesses with NIB Document:', r3.rows[0].total);
    
    // Businesses WITHOUT NIB
    const r4 = await pg.query("SELECT count(*) as total FROM businesses WHERE nib_number IS NULL OR nib_number = ''");
    console.log('Businesses WITHOUT NIB Number:', r4.rows[0].total);
    
    await pg.end();
}
check();
