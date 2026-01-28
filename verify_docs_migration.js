const { Client } = require('pg');
require('dotenv').config();

async function verify() {
    const pgClient = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pgClient.connect();
    try {
        console.log('--- Verifying Logbook Documents ---');
        const { rows: docs } = await pgClient.query(`
            SELECT ld.logbook_id, d.label, d.file_url 
            FROM logbook_documents ld 
            JOIN documents d ON ld.document_id = d.id 
            LIMIT 10
        `);
        console.log('Sample Logbook Documents:');
        console.table(docs);

        const { rows: count } = await pgClient.query('SELECT COUNT(*) FROM logbook_documents');
        console.log('Total Logbook Documents linked:', count[0].count);

        console.log('\n--- Verifying Monthly Report Documents ---');
        const { rows: mDocs } = await pgClient.query(`
            SELECT mrd.monthly_report_id, d.label, d.file_url 
            FROM monthly_report_documents mrd 
            JOIN documents d ON mrd.document_id = d.id 
            LIMIT 10
        `);
        console.table(mDocs);
        const { rows: mCount } = await pgClient.query('SELECT COUNT(*) FROM monthly_report_documents');
        console.log('Total Monthly Report Documents linked:', mCount[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await pgClient.end();
    }
}
verify();
