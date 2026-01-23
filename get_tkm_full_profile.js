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
        pr.full_name,
        pr.id_number, 
        pr.whatsapp_number, 
        pr.gender, 
        pr.avatar_url, 
        pr.pob, 
        pr.dob,
        u.username,
        u.email,
        b.name as business_name, 
        b.sector as business_sector,
        b.type as business_type,
        b.description as business_description,
        b.main_product,
        b.nib_number
      FROM participants p
      LEFT JOIN profiles pr ON p.profile_id = pr.id
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN businesses b ON p.id = b.participant_id
      LIMIT 1
    `;
    const res = await client.query(query);
    if (res.rows.length > 0) {
      console.log('--- Detailed TKM Profile Data ---');
      console.log(JSON.stringify(res.rows[0], (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        return value;
      }, 2));
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
