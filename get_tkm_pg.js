const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM participants LIMIT 1');
    if (res.rows.length > 0) {
      console.log('--- 1 Data TKM (Participants) ---');
      console.log(JSON.stringify(res.rows[0], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
    } else {
      console.log('No data found in participants table.');
    }
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
