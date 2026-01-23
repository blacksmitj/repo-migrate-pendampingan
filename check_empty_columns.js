const { Client } = require('pg');
require('dotenv').config();

async function checkNulls() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const tables = ['participants', 'profiles', 'businesses', 'users'];
    
    console.log('--- Database Null Content Audit ---');
    console.log('Counting totally empty columns (100% null) across records.\n');

    for (const table of tables) {
        console.log(`Table: ${table}`);
        
        // Get column names
        const resCols = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, [table]);
        
        const cols = resCols.rows.map(r => r.column_name);
        if (cols.length === 0) continue;

        // Get total count
        const { rows: totalRows } = await client.query(`SELECT count(*) FROM ${table}`);
        const total = parseInt(totalRows[0].count);
        
        if (total === 0) {
            console.log(`  ! Table is empty (0 records)`);
            continue;
        }

        // Check each column for non-null values
        for (const col of cols) {
            const { rows: nonNullRes } = await client.query(`SELECT count("${col}") as count FROM ${table} WHERE "${col}" IS NOT NULL`);
            const nonNullCount = parseInt(nonNullRes[0].count);
            
            if (nonNullCount === 0) {
                console.log(`  [EMPTY] ${col} (0 / ${total} populated)`);
            } else if (nonNullCount < total) {
                const percent = ((nonNullCount / total) * 100).toFixed(1);
                console.log(`  [PARTIAL] ${col} (${nonNullCount} / ${total} populated - ${percent}%)`);
            } else {
                // console.log(`  [FULL] ${col}`);
            }
        }
        console.log('');
    }

    await client.end();
}

checkNulls();
