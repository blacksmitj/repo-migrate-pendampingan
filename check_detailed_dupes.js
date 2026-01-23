const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const c = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    console.log('--- 1. NIK Duplikasi di Tabel PROFILES (User/Mentor) ---');
    const [profileDupes] = await c.query(`
        SELECT p.nik, GROUP_CONCAT(u.name SEPARATOR ', ') as names, COUNT(*) as count 
        FROM profiles p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.nik IS NOT NULL AND p.nik != ""
        GROUP BY p.nik 
        HAVING count > 1
    `);
    profileDupes.forEach(d => console.log(`NIK: ${d.nik} | Nama: ${d.names} | Jumlah: ${d.count}`));

    console.log('\n--- 2. NIK Duplikasi di Tabel PESERTA ---');
    const [pesertaDupes] = await c.query(`
        SELECT nik, GROUP_CONCAT(nama_usaha SEPARATOR ', ') as usahas, COUNT(*) as count 
        FROM peserta 
        WHERE nik IS NOT NULL AND nik != ""
        GROUP BY nik 
        HAVING count > 1
    `);
    pesertaDupes.forEach(d => console.log(`NIK: ${d.nik} | Usaha: ${d.usahas} | Jumlah: ${d.count}`));

    console.log('\n--- 3. NIK yang muncul di KEDUA tabel (User & Peserta) ---');
    const [crossDupes] = await c.query(`
        SELECT p.nik, u.name as mentor_name, ps.nama_usaha as participant_usaha
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        JOIN peserta ps ON p.nik = ps.nik
        WHERE p.nik IS NOT NULL AND p.nik != ""
    `);
    crossDupes.forEach(d => console.log(`NIK: ${d.nik} | Mentor: ${d.mentor_name} | Peserta (Usaha): ${d.participant_usaha}`));

    await c.end();
}
check();
