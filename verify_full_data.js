const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const tkmId = '532364';

    try {
        console.log(`\n--- Verifikasi Data Lengkap TKM: ${tkmId} ---\n`);

        const res = await client.query(`
            SELECT 
                p.legacy_tkm_id,
                p.registration_date,
                p.submission_status,
                pr.full_name,
                pr.kk_number,
                pr.age,
                pr.social_media_name,
                pr.social_media_link,
                addr.label as addr_label,
                addr.address_line,
                addr.postal_code,
                dist.name as district_name,
                ec.full_name as emergency_name,
                ec.phone_number as emergency_phone,
                b.name as business_name,
                b.marketing_countries,
                b.detailed_location
            FROM participants p
            JOIN profiles pr ON p.profile_id = pr.id
            LEFT JOIN addresses addr ON pr.id = addr.profile_id
            LEFT JOIN districts dist ON addr.district_id = dist.id
            LEFT JOIN emergency_contacts ec ON p.id = ec.participant_id
            LEFT JOIN businesses b ON p.id = b.participant_id
            WHERE p.legacy_tkm_id = $1
        `, [tkmId]);

        if (res.rows.length > 0) {
            console.log('HASIL VERIFIKASI:');
            // Group addresses
            const data = res.rows[0];
            const result = {
                personal: {
                    nama: data.full_name,
                    kk: data.kk_number,
                    umur: data.age,
                    medsos: data.social_media_name,
                    medsos_link: data.social_media_link
                },
                pendaftaran: {
                    tgl_daftar: data.registration_date,
                    status_submit: data.submission_status
                },
                kontak_darurat: res.rows.map(r => ({ name: r.emergency_name, phone: r.emergency_phone })).filter((v,i,a)=>a.findIndex(t=>(t.name === v.name))===i),
                alamat: res.rows.map(r => ({ label: r.addr_label, line: r.address_line, zip: r.postal_code, kecamatan: r.district_name })),
                bisnis: {
                    nama: data.business_name,
                    negara_pemasaran: data.marketing_countries,
                    lokasi_detil: data.detailed_location
                }
            };
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('Data tidak ditemukan.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
