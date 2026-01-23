const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const pgClient = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pgClient.connect();
    const { rows } = await pgClient.query('SELECT count(*) as total, count(profile_id) as linked, count(fund_disbursement) as with_detail FROM participants');
    console.log(`Participants - Total: ${rows[0].total}, Linked: ${rows[0].linked}, With Detail: ${rows[0].with_detail}`);
    
    const { rows: roles } = await pgClient.query('SELECT name, count(*) FROM users u JOIN roles r ON u.role_id = r.id GROUP BY r.name');
    console.log('User Roles Distribution:');
    roles.forEach(r => console.log(`- ${r.name}: ${r.count}`));

    const { rows: emp } = await pgClient.query('SELECT count(*) as total FROM business_employees');
    console.log(`Business Employees - Total: ${emp[0].total}`);

    const { rows: docs } = await pgClient.query('SELECT entity_type, count(*) FROM documents GROUP BY entity_type');
    console.log('Documents Distribution:');
    docs.forEach(d => console.log(`- ${d.entity_type}: ${d.count}`));

    await pgClient.end();
}
check();
