const mysql = require('mysql2/promise');
const { Client } = require('pg');
require('dotenv').config();

async function audit() {
    const mysqlConn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    const pgClient = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await pgClient.connect();

    const tkmId = '532364';

    try {
        console.log(`--- Auditing TKM ${tkmId} ---`);

        // 1. Get current Postgres data
        const { rows: pgData } = await pgClient.query(`
            SELECT 
                p.id as p_id, p.legacy_tkm_id, p.status as p_status, p.last_education as p_edu, p.current_activity as p_act,
                pr.full_name as pr_name, pr.id_number as pr_nik, pr.whatsapp_number as pr_wa, pr.gender as pr_gender, pr.pob as pr_pob, pr.dob as pr_dob, pr.avatar_url as pr_avatar,
                b.name as b_name, b.sector as b_sector, b.nib_number as b_nib, b.main_product as b_product
            FROM participants p
            LEFT JOIN profiles pr ON p.profile_id = pr.id
            LEFT JOIN businesses b ON p.id = b.participant_id
            WHERE p.legacy_tkm_id = $1
        `, [tkmId]);

        const pg = pgData[0] || {};
        console.log('\n[Postgres Current State]');
        console.log(JSON.stringify(pg, null, 2));

        // 2. Get Legacy MySQL data (Comprehensive)
        const [mPeserta] = await mysqlConn.query('SELECT * FROM peserta WHERE id_tkm = ?', [tkmId]);
        const [mCopy] = await mysqlConn.query('SELECT * FROM peserta_copy1 WHERE id_tkm = ?', [tkmId]);
        const mP = mPeserta[0] || {};
        const mC = mCopy[0] || {};

        let mProf = {};
        if (mP.nik) {
            const [rows] = await mysqlConn.query('SELECT * FROM profiles WHERE nik = ?', [mP.nik]);
            mProf = rows[0] || {};
        }

        console.log('\n[Legacy MySQL State]');
        const mysqlState = {
            peserta: {
                nama: mP.nama,
                nik: mP.nik,
                no_whatsapp: mP.no_whatsapp,
                tempat_lahir: mP.tempat_lahir,
                tgl_lahir: mP.tgl_lahir,
                aktivitas_saat_ini: mP.aktivitas_saat_ini,
                pendidikan_terakhir: mP.pendidikan_terakhir,
                link_pas_foto: mP.link_pas_foto
            },
            peserta_copy1: {
                gender: mC.gender,
                no_whatsapp: mC.no_whatsapp,
                pendidikan_terakhir: mC.pendidikan_terakhir,
                email: mC.email
            },
            profiles: {
                jenis_kelamin: mProf.jenis_kelamin,
                no_wa: mProf.no_wa,
                foto: mProf.foto
            }
        };
        console.log(JSON.stringify(mysqlState, null, 2));

        // 3. Identification of "Data Available but not Migrated"
        console.log('\n--- Missing Mapping Analysis ---');
        const analysis = [];
        if (!pg.pr_wa && (mP.no_whatsapp || mC.no_whatsapp || mProf.no_wa)) analysis.push('WhatsApp Number missing');
        if (!pg.pr_pob && mP.tempat_lahir) analysis.push('Place of Birth missing');
        if (!pg.pr_dob && mP.tgl_lahir) analysis.push('Date of Birth missing');
        if (!pg.pr_gender && (mC.gender || mProf.jenis_kelamin)) analysis.push('Gender missing');
        if (!pg.pr_avatar && (mP.link_pas_foto || mProf.foto)) analysis.push('Avatar URL missing');
        
        if (analysis.length === 0) {
            console.log('All available legacy data seems to be migrated or is truly empty in MySQL.');
        } else {
            console.log('Unmapped Data Found:');
            analysis.forEach(a => console.log(' - ' + a));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mysqlConn.end();
        await pgClient.end();
    }
}

audit();
