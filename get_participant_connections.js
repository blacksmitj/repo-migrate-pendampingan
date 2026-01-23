const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Change this ID to check other participants
    const tkmId = process.argv[2] || '532364';

    console.log(`\n--- Mencari Koneksi Data untuk TKM: ${tkmId} ---\n`);

    const query = `
        SELECT 
            p_prof.full_name as nama_peserta,
            p.legacy_tkm_id as id_tkm,
            json_agg(json_build_object(
                'label', addr.label,
                'alamat', addr.address_line,
                'kota', reg.name,
                'provinsi', prov.name
            )) as alamat_list,
            m_prof.full_name as nama_pendamping,
            univ.name as univ_pendamping,
            univ.city as kota_univ
        FROM participants p
        JOIN profiles p_prof ON p.profile_id = p_prof.id
        LEFT JOIN addresses addr ON p_prof.id = addr.profile_id
        LEFT JOIN regencies reg ON addr.regency_id = reg.id
        LEFT JOIN provinces prov ON addr.province_id = prov.id
        LEFT JOIN mentor_participants mp ON p.id = mp.participant_id
        LEFT JOIN mentors m ON mp.mentor_id = m.id
        LEFT JOIN users m_user ON m.user_id = m_user.id
        LEFT JOIN profiles m_prof ON m_user.id = m_prof.user_id
        LEFT JOIN universities univ ON m_prof.university_id = univ.id
        WHERE p.legacy_tkm_id = $1
        GROUP BY p_prof.full_name, p.legacy_tkm_id, m_prof.full_name, univ.name, univ.city
    `;

    try {
        const res = await client.query(query, [tkmId]);
        
        if (res.rows.length > 0) {
            const data = res.rows[0];
            const output = {
                nama_peserta: data.nama_peserta,
                id_tkm: data.id_tkm,
                alamat: {},
                pendamping: {
                    nama: data.nama_pendamping,
                    asal_universitas: data.univ_pendamping,
                    lokasi_universitas: data.kota_univ
                }
            };
            
            data.alamat_list.forEach(a => {
                if (a.label) {
                    output.alamat[a.label] = {
                        jalan: a.alamat,
                        kota: a.kota,
                        provinsi: a.provinsi
                    };
                }
            });

            console.log('HASIL PENCARIAN:');
            console.log(JSON.stringify(output, null, 2));
        } else {
            console.log('Data tidak ditemukan untuk ID TKM tersebut.');
        }
    } catch (err) {
        console.error('Query Error:', err);
    } finally {
        await client.end();
    }
}

main();
