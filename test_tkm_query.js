const { Client } = require('pg');
require('dotenv').config();

async function testTkmQuery(tkm) {
    const c = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await c.connect();

    console.log('\n========== QUERY BY ID TKM:', tkm, '==========\n');

    // Participants
    const p = await c.query('SELECT id, status, last_education FROM participants WHERE legacy_tkm_id = $1', [tkm]);
    console.log('PARTICIPANTS:', p.rows.length > 0 ? 'Found' : 'Not Found');
    if (p.rows[0]) console.log('  - Status:', p.rows[0].status, '| Education:', p.rows[0].last_education);

    // Businesses
    const b = await c.query('SELECT id, name, sector, nib_number FROM businesses WHERE legacy_tkm_id = $1', [tkm]);
    console.log('\nBUSINESSES:', b.rows.length > 0 ? 'Found' : 'Not Found');
    if (b.rows[0]) console.log('  - Name:', b.rows[0].name, '| Sector:', b.rows[0].sector);

    // Logbooks
    const l = await c.query('SELECT count(*) as total FROM logbooks WHERE legacy_tkm_id = $1', [tkm]);
    console.log('\nLOGBOOKS:', l.rows[0].total, 'records');

    // Monthly Reports
    const m = await c.query('SELECT count(*) as total FROM monthly_reports WHERE legacy_tkm_id = $1', [tkm]);
    console.log('MONTHLY REPORTS:', m.rows[0].total, 'records');

    // Mentor Assignments
    const mp = await c.query('SELECT count(*) as total FROM mentor_participants WHERE legacy_tkm_id = $1', [tkm]);
    console.log('MENTOR ASSIGNMENTS:', mp.rows[0].total, 'records');

    console.log('\n==========================================\n');
    await c.end();
}

const tkm = process.argv[2] || '532364';
testTkmQuery(tkm);
