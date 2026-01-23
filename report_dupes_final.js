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

    console.log('=== LAPORAN DETAIL DUPLIKASI NIK ===\n');

    // 1. NIK yang ada di MENTOR (User) sekaligus di PESERTA
    console.log('1. NIK yang Terdaftar sebagai MENTOR dan PESERTA:');
    const [cross] = await c.query(`
        SELECT p.nik, u.name as nama_user, ps.nama as nama_peserta
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        JOIN peserta ps ON p.nik = ps.nik
        WHERE p.nik IS NOT NULL AND p.nik != ""
    `);
    if (cross.length > 0) {
        cross.forEach(d => console.log(`NIK: ${d.nik} | Nama User: ${d.nama_user} | Nama Peserta: ${d.nama_peserta}`));
    } else {
        console.log('Tidak ada NIK yang muncul di kedua tabel.');
    }

    // 2. NIK yang Duplikat di Internal MENTOR (Satu NIK punya banyak akun)
    console.log('\n2. NIK yang Duplikat di Internal MENTOR (Satu NIK punya >1 akun):');
    const [userDupes] = await c.query(`
        SELECT p.nik, GROUP_CONCAT(u.name SEPARATOR ' & ') as names, COUNT(*) as count 
        FROM profiles p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.nik IS NOT NULL AND p.nik != ""
        GROUP BY p.nik 
        HAVING count > 1
    `);
    if (userDupes.length > 0) {
        userDupes.forEach(d => console.log(`NIK: ${d.nik} | Nama-nama Akun: ${d.names} (${d.count} kali)`));
    } else {
        console.log('Tidak ada duplikasi NIK di internal Mentor.');
    }

    // 3. NIK yang Duplikat di Internal PESERTA (Satu NIK daftar banyak kali)
    console.log('\n3. NIK yang Duplikat di Internal PESERTA (Satu NIK terdaftar >1 kali):');
    const [partDupes] = await c.query(`
        SELECT nik, GROUP_CONCAT(nama SEPARATOR ' & ') as names, COUNT(*) as count 
        FROM peserta 
        WHERE nik IS NOT NULL AND nik != ""
        GROUP BY nik 
        HAVING count > 1
    `);
    if (partDupes.length > 0) {
        partDupes.forEach(d => console.log(`NIK: ${d.nik} | Nama-nama di Daftar: ${d.names} (${d.count} kali)`));
    } else {
        console.log('Tidak ada duplikasi NIK di internal Peserta.');
    }

    await c.end();
}
check();
