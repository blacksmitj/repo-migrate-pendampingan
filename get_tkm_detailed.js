const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const query = `
      SELECT 
        p.*,
        pr.id_number, pr.whatsapp_number, pr.gender,
        b.name as business_name, b.sector as business_sector
      FROM participants p
      LEFT JOIN profiles pr ON p.profile_id = pr.id
      LEFT JOIN businesses b ON p.id = b.participant_id
      LIMIT 1
    `;
    const res = await client.query(query);
    if (res.rows.length > 0) {
      console.log('--- Detailed TKM Data ---');
      console.log(JSON.stringify(res.rows[0], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
      console.log('No data found.');
    }
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
