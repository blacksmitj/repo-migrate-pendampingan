const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function bulkInsert(pgClient, table, columns, data, batchSize = 1000) {
    if (data.length === 0) return;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const placeholders = batch.map((_, rowIndex) => 
            `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
        ).join(', ');
        const values = batch.flat();
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        await pgClient.query(query, values);
    }
}

async function runSqlFile(pgClient, filePath) {
    console.log(`Running script: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await pgClient.query(sql);
}

async function migrate() {
    const mysqlConn = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });
    const pgClient = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pgClient.connect();

    try {
        console.log('--- Resetting Schema ---');
        await pgClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        await pgClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/001_core_tables.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/002_participant_tables.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/003_activity_tables.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/004_mentor_assignments.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/005_seed_roles.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/006_documents_relations.sql');
        await runSqlFile(pgClient, 'd:/react/pendamping-sql/migrations/007_upload_reports.sql');

        const { rows: rRows } = await pgClient.query('SELECT id, name FROM roles');
        const roleMap = new Map(rRows.map(r => [r.name, r.id]));

        console.log('Migrating Geography...');
        const [mysqlProvinces] = await mysqlConn.query('SELECT id, prov_name as name FROM provinces');
        await bulkInsert(pgClient, 'provinces', ['id', 'name'], mysqlProvinces.map(p => [p.id, p.name]));
        const provIds = new Set(mysqlProvinces.map(p => p.id));
        const [mysqlCities] = await mysqlConn.query('SELECT id, prov_id as province_id, city_name as name FROM cities');
        await bulkInsert(pgClient, 'regencies', ['id', 'province_id', 'name'], mysqlCities.map(c => [c.id, c.province_id, c.name]));
        const regIds = new Set(mysqlCities.map(c => c.id));
        const [mysqlDistricts] = await mysqlConn.query('SELECT dist_id as id, city_id as regency_id, dist_name as name FROM districts');
        await bulkInsert(pgClient, 'districts', ['id', 'regency_id', 'name'], mysqlDistricts.map(d => [d.id, d.regency_id, d.name]));
        const distIds = new Set(mysqlDistricts.map(d => d.id));
        const [mysqlSubdistricts] = await mysqlConn.query('SELECT subdist_id as id, dist_id as district_id, subdist_name as name FROM subdistricts');
        await bulkInsert(pgClient, 'villages', ['id', 'district_id', 'name'], mysqlSubdistricts.map(s => [s.id, s.district_id, s.name]), 1000);
        const villIds = new Set(mysqlSubdistricts.map(v => v.id));

        // Create Geography Name-to-ID Maps for later use
        const provinceByName = new Map(mysqlProvinces.map(p => [p.name.toUpperCase(), p.id]));
        const regencyByName = new Map(mysqlCities.map(c => [c.name.toUpperCase(), c.id]));

        console.log('Migrating Universities...');
        const [mUnivs] = await mysqlConn.query('SELECT * FROM universities');
        const univMap = new Map();
        for (const u of mUnivs) {
            const id = uuidv4();
            await pgClient.query('INSERT INTO universities (id, name, address, city, province, legacy_id) VALUES ($1, $2, $3, $4, $5, $6)', 
                [id, u.name, u.alamat, u.city, u.province, u.id]);
            univMap.set(u.id.toString(), id);
        }

        console.log('Migrating Batches & Groups...');
        const [mBatches] = await mysqlConn.query('SELECT * FROM batch');
        const batchMap = new Map();
        for (const b of mBatches) {
            const id = uuidv4();
            await pgClient.query('INSERT INTO batches (id, code, start_date) VALUES ($1, $2, $3)', [id, b.batchID.toString(), b.startdate]);
            batchMap.set(b.batchID.toString(), id);
        }
        const [mGroups] = await mysqlConn.query('SELECT * FROM group_peserta');
        const groupMap = new Map();
        for (const g of mGroups) {
            const id = uuidv4();
            await pgClient.query('INSERT INTO participant_groups (id, legacy_tkm_id, name) VALUES ($1, $2, $3)', [id, g.id_tkm_pemula_terakhir, g.nama_group]);
            groupMap.set(g.id.toString(), id);
        }

        console.log('Migrating Users...');
        const [mUsers] = await mysqlConn.query('SELECT * FROM users');
        const mentorRoleId = roleMap.get('mentor');
        for (const u of mUsers) {
            const id = uuidv4();
            // Added ON CONFLICT (username) DO NOTHING to handle legacy duplicates
            await pgClient.query('INSERT INTO users (id, role_id, username, email, password, created_at, updated_at, legacy_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (username) DO NOTHING', 
                [id, mentorRoleId, u.name || u.email, u.email, u.password || 'TEMPORARY_PWD', u.created_at, u.updated_at, u.id]);
        }
        
        // Fetch back user mappings after conflict resolution
        const { rows: pgUsers } = await pgClient.query('SELECT id, legacy_id FROM users');
        const userMap = new Map(pgUsers.map(u => [u.legacy_id.toString(), u.id]));

        console.log('Migrating Profiles (from Users)...');
        const [mProfiles] = await mysqlConn.query('SELECT * FROM profiles');
        const [mCopyData] = await mysqlConn.query('SELECT id_tkm, gender FROM peserta_copy1 WHERE gender IS NOT NULL');
        const genderByTkmMap = new Map(mCopyData.map(c => [c.id_tkm?.toString(), c.gender]));

        const profileMap = new Map();
        const profileByNikMap = new Map();
        for (const p of mProfiles) {
            const uId = userMap.get(p.user_id.toString());
            if (uId) {
                const id = uuidv4();
                const uUnivId = p.univ_id ? univMap.get(p.univ_id.toString()) : null;
                await pgClient.query('INSERT INTO profiles (id, user_id, university_id, full_name, id_number, whatsapp_number, kk_number, age, social_media_type, social_media_name, social_media_link, gender, avatar_url, pob, dob, created_at, updated_at, legacy_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT (user_id) DO NOTHING',
                    [
                        id, 
                        uId, 
                        uUnivId,
                        mUsers.find(mu => mu.id.toString() === p.user_id.toString())?.name || null, 
                        p.nik, 
                        p.no_wa,
                        null, null, null, null, null, // kk_number, age, social_media_type, social_media_name, social_media_link
                        p.jenis_kelamin, 
                        p.foto, 
                        p.tempat_lahir, 
                        p.tanggal_lahir, 
                        p.created_at, 
                        p.updated_at, 
                        p.id
                    ]);
                profileMap.set(p.id.toString(), id);
                if (p.nik) profileByNikMap.set(p.nik, id);
            }
        }

        // Load Districts for lookup
        const districtsRes = await pgClient.query('SELECT id, name, regency_id FROM districts');
        const districtLookup = new Map();
        districtsRes.rows.forEach(d => {
            districtLookup.set(`${d.regency_id}_${d.name.toUpperCase()}`, d.id);
        });

        console.log('Migrating Participants & creating missing Profiles...');
        const [mPeserta] = await mysqlConn.query('SELECT * FROM peserta');
        const partMap = new Map();
        const partByIdTkmMap = new Map();
        for (const p of mPeserta) {
            let prId = profileByNikMap.get(p.nik);
            
            // IF Participant doesn't have a Profile yet, create it!
            const gender = genderByTkmMap.get(p.id_tkm?.toString());
            if (!prId) {
                prId = uuidv4();
                // Create a basic profile with available info from peserta table
                await pgClient.query(`
                    INSERT INTO profiles (
                        id, full_name, id_number, kk_number, age, whatsapp_number, 
                        social_media_type, social_media_name, social_media_link,
                        gender, pob, dob, avatar_url, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
                    ON CONFLICT DO NOTHING`, 
                    [prId, p.nama, p.nik, p.no_kk, p.umur, p.no_whatsapp, 
                     p.jenis_medsos, p.nama_medsos, p.link_media_sosial,
                     gender, p.tempat_lahir, p.tgl_lahir, p.link_pas_foto, p.created_at || new Date(), p.updated_at || new Date()]);
                if (p.nik) profileByNikMap.set(p.nik, prId);
            } else {
                // Update existing profile (from users) with info from peserta table if current is null
                await pgClient.query(`
                    UPDATE profiles SET 
                        full_name = COALESCE(full_name, $1),
                        whatsapp_number = COALESCE(whatsapp_number, $2),
                        kk_number = COALESCE(kk_number, $3),
                        age = COALESCE(age, $4),
                        social_media_type = COALESCE(social_media_type, $5),
                        social_media_name = COALESCE(social_media_name, $6),
                        social_media_link = COALESCE(social_media_link, $7),
                        gender = COALESCE(gender, $8),
                        pob = COALESCE(pob, $9),
                        dob = COALESCE(dob, $10),
                        avatar_url = COALESCE(avatar_url, $11)
                    WHERE id = $12
                `, [p.nama, p.no_whatsapp, p.no_kk, p.umur, p.jenis_medsos, p.nama_medsos, p.link_media_sosial, gender, p.tempat_lahir, p.tgl_lahir, p.link_pas_foto, prId]);
            }

            const sLower = p.status?.toLowerCase();
            const status = sLower === 'diterima' ? 'active' : (sLower === 'cadangan' ? 'deactive' : p.status);

            const id = uuidv4();
            await pgClient.query(`
                INSERT INTO participants (
                    id, profile_id, batch_id, group_id, legacy_tkm_id, status, last_education, 
                    disability_status, disability_type, current_activity, 
                    submission_status, submission_date, registration_date, id_pendaftar, link_detail_tkm,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
                ON CONFLICT DO NOTHING`,
                [id, prId, batchMap.get(p.batch_pembekalan), null, p.id_tkm?.toString(), status, p.pendidikan_terakhir, 
                 p.penyandang_disabilitas === 1, p.jenis_disabilitas, p.aktivitas_saat_ini,
                 p.apakah_sudah_submit_pendaftaran, p.tanggal_submit_pendaftaran, p.tanggal_daftar, p.id_pendaftar, p.link_detail_tkm,
                 p.created_at || new Date(), p.updated_at || new Date()]);
            
            partMap.set(p.no.toString(), id);
            partByIdTkmMap.set(p.id_tkm.toString(), id);

            // Create Address for Participant from KTP info
            if (p.alamat_ktp || p.kota_ktp || p.provinsi_ktp) {
                const provId = null;
                const regId = null;
                const distId = null;
                
                await pgClient.query(`
                    INSERT INTO addresses (
                        id, profile_id, label, province_id, regency_id, district_id, 
                        province_name, regency_name, district_name,
                        address_line, postal_code, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
                    [uuidv4(), prId, 'KTP', provId, regId, distId, 
                     p.provinsi_ktp, p.kota_ktp, p.kecamatan_ktp,
                     p.alamat_ktp, p.kode_pos_ktp, p.created_at || new Date(), p.updated_at || new Date()]);
            }

            // Create Business Address for Participant (label 'USAHA')
            if (p.alamat_usaha || p.kota_usaha || p.provinsi_usaha) {
                const provId = null;
                const regId = null;
                const distId = null;
                
                await pgClient.query(`
                    INSERT INTO addresses (
                        id, profile_id, label, province_id, regency_id, district_id, 
                        province_name, regency_name, district_name,
                        address_line, postal_code, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
                    [uuidv4(), prId, 'USAHA', provId, regId, distId, 
                     p.provinsi_usaha, p.kota_usaha, p.kecamatan_usaha,
                     p.alamat_usaha, p.kode_pos_usaha, p.created_at || new Date(), p.updated_at || new Date()]);
            }

            // Create Domicile Address for Participant (label 'DOMISILI')
            if (p.alamat_domisili || p.kota_domisili || p.provinsi_domisili) {
                const provId = null;
                const regId = null;
                const distId = null;
                
                await pgClient.query(`
                    INSERT INTO addresses (
                        id, profile_id, label, province_id, regency_id, district_id, 
                        province_name, regency_name, district_name,
                        address_line, postal_code, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
                    [uuidv4(), prId, 'DOMISILI', provId, regId, distId, 
                     p.provinsi_domisili, p.kota_domisili, p.kecamatan_domisili,
                     p.alamat_domisili, p.kode_pos_domisili, p.created_at || new Date(), p.updated_at || new Date()]);
            }

            // Emergency Contacts
            if (p.nama_kerabat_1) {
                await pgClient.query('INSERT INTO emergency_contacts (id, participant_id, legacy_tkm_id, full_name, phone_number, relationship, priority) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
                    [uuidv4(), id, p.id_tkm?.toString(), p.nama_kerabat_1, p.no_kerabat_1, p.status_kerabat_1, 1]);
            }
            if (p.nama_kerabat_2) {
                await pgClient.query('INSERT INTO emergency_contacts (id, participant_id, legacy_tkm_id, full_name, phone_number, relationship, priority) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
                    [uuidv4(), id, p.id_tkm?.toString(), p.nama_kerabat_2, p.no_kerabat_2, p.status_kerabat_2, 2]);
            }
        }

        console.log('Migrating Peserta Detail into Participants/Profiles...');
        const [mDetails] = await mysqlConn.query('SELECT * FROM peserta_detail');
        for (const d of mDetails) {
            const paId = partByIdTkmMap.get(d.id_tkm.toString());
            if (paId) {
                // Update participants with detail fields
                await pgClient.query(`
                    UPDATE participants SET 
                        communication_status = $1,
                        fund_disbursement = $2,
                        presence_status = $3,
                        willing_to_be_assisted = $4,
                        reason_not_willing = $5,
                        status_applicant = $6,
                        reason_drop = $7
                    WHERE id = $8
                `, [d.communicationStatus, d.fundDisbursement, d.presenceStatus, d.willingToBeAssisted, d.reasonNotWilling, d.statusApplicant, d.reasonDrop, paId]);

                // Handle documents from detail
                if (d.bmcFile) {
                    const docId = uuidv4();
                    await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', 
                        [docId, paId, 'participant', 'BMC', d.bmcFile]);
                }
                if (d.actionPlanFile) {
                    const docId = uuidv4();
                    await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', 
                        [docId, paId, 'participant', 'ACTION_PLAN', d.actionPlanFile]);
                }
            }
        }

        console.log('Migrating Addresses...');
        const [mAddresses] = await mysqlConn.query('SELECT * FROM addresses');
        for (const a of mAddresses) {
            const prId = profileMap.get(a.profile_id.toString());
            if (prId) {
                await pgClient.query('INSERT INTO addresses (id, profile_id, label, province_id, regency_id, district_id, village_id, address_line, postal_code, longitude, latitude, google_maps_link, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT DO NOTHING',
                    [uuidv4(), prId, a.label, provIds.has(a.prov_id) ? a.prov_id : null, regIds.has(a.city_id) ? a.city_id : null, distIds.has(a.district_id) ? a.district_id : null, villIds.has(a.subdistrict_id) ? a.subdistrict_id : null, a.address, a.postal_code, a.longitude, a.latitude, a.link_maps, a.created_at, a.updated_at]);
            }
        }

        console.log('Migrating Businesses...');
        const businessMap = new Map();
        const businessMapByIdTkm = new Map();
        for (const p of mPeserta) {
             const pId = partMap.get(p.no.toString());
             if (pId) {
                 const bId = uuidv4();
                 await pgClient.query(`
                    INSERT INTO businesses (
                        id, participant_id, legacy_tkm_id, name, sector, type, description, main_product, 
                        location_ownership, nib_number, marketing_channels, marketing_areas, 
                        marketing_countries, detailed_location,
                        partner_name, partner_count, revenue_per_period, profit_per_period, 
                        production_volume, production_unit, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) 
                    ON CONFLICT DO NOTHING`,
                    [bId, pId, p.id_tkm?.toString(), p.nama_usaha, p.sektor_usaha, p.jenis_usaha, p.deskripsi_usaha, p.produk_utama, 
                     p.kepemilikan_lokasi_usaha, p.nomor_nib, p.saluran_pemasaran, p.wilayah_pemasaran, 
                     p.wilayah_negara_pemasaran, p.lokasi_usaha,
                     p.mitra_usaha, p.jumlah_mitra_usaha, p.omset_per_periode, p.laba_per_periode, 
                     p.jumlah_produk_per_periode, p.satuan_jumlah_produk_per_periode, p.created_at || new Date(), p.updated_at || new Date()]);
                 businessMap.set(p.no.toString(), bId);
                 businessMapByIdTkm.set(p.id_tkm.toString(), bId);

                 // Employee from Peserta table (tenaga_kerja1)
                 if (p.tenaga_kerja1_nama) {
                     await pgClient.query('INSERT INTO business_employees (id, business_id, name, nik, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                         [uuidv4(), bId, p.tenaga_kerja1_nama, p.tenaga_kerja1_nik, 'Karyawan 1']);
                 }
             }
        }

        console.log('Migrating Business Employees (from tkm_new_employee)...');
        const [mEmployees] = await mysqlConn.query('SELECT * FROM tkm_new_employee');
        for (const e of mEmployees) {
            // capaian_output_id in legacy might link back to participant's business via capaian_output -> id_tkm
            // Actually, let's look at legacy schema again. tkm_new_employee.capaian_output_id matches capaian_output.id
            // and capaian_output has id_tkm.
            const [mReps] = await mysqlConn.query('SELECT id_tkm FROM capaian_output WHERE id = ?', [e.capaian_output_id]);
            if (mReps.length > 0) {
                const bId = businessMapByIdTkm.get(mReps[0].id_tkm);
                if (bId) {
                    const empId = uuidv4();
                    await pgClient.query(`
                        INSERT INTO business_employees (id, business_id, name, nik, gender, role, employment_status, bpjs_status, bpjs_number, bpjs_type, disability, disability_type, is_active, created_at, updated_at, legacy_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    `, [empId, bId, e.name, e.nik, e.gender, e.role, e.employment_status, e.bpjs_status, e.bpjs_number, e.bpjs_type, e.disability === 'T', e.disabilityType, e.isaktif === 'T', e.created_at, e.updated_at, e.id]);

                    // Handle employee documents
                    if (e.ktp_url) {
                        await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5)', 
                            [uuidv4(), empId, 'business_employee', 'KTP', e.ktp_url]);
                    }
                    if (e.bpjs_card_url) {
                        await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5)', 
                            [uuidv4(), empId, 'business_employee', 'BPJS', e.bpjs_card_url]);
                    }
                    if (e.salary_slip_url) {
                        await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5)', 
                            [uuidv4(), empId, 'business_employee', 'SALARY_SLIP', e.salary_slip_url]);
                    }
                }
            }
        }

        console.log('Migrating Mentors...');
        const [mList] = await mysqlConn.query('SELECT id_pendamping as id FROM logbook_harian UNION SELECT id_pendamping as id FROM capaian_output UNION SELECT admin_id as id FROM user_peserta');
        const mentorMap = new Map();
        for (const m of mList) {
            if (m.id) {
                const uId = userMap.get(m.id.toString());
                if (uId) {
                    const id = uuidv4();
                    await pgClient.query('INSERT INTO mentors (id, user_id, legacy_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [id, uId, m.id]);
                    mentorMap.set(m.id.toString(), id);
                }
            }
        }

        console.log('Migrating Logbooks...');
        const [mLogs] = await mysqlConn.query('SELECT * FROM logbook_harian');
        for (const lb of mLogs) {
            const meId = mentorMap.get(lb.id_pendamping.toString());
            const paId = partByIdTkmMap.get(lb.id_tkm.toString());
            if (meId && paId) {
                await pgClient.query('INSERT INTO logbooks (id, mentor_id, participant_id, legacy_tkm_id, activity_date, start_time, end_time, meeting_type, visit_type, delivery_method, mentoring_material, activity_summary, obstacles, solutions, is_verified, verification_note, expense_amount, no_expense_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT DO NOTHING',
                    [uuidv4(), meId, paId, lb.id_tkm?.toString(), lb.logbookDate, lb.startTime, lb.endTime, lb.meetingType, lb.visitType, lb.deliveryMethod, lb.mentoringMaterial, lb.activitySummary, lb.obstacle, lb.solutions, lb.verified, lb.note_verified, lb.totalExpense, lb.reasonNoExpense]);
            }
        }

        console.log('Migrating Monthly Reports...');
        const [mReps] = await mysqlConn.query('SELECT * FROM capaian_output');
        for (const r of mReps) {
            const meId = mentorMap.get(r.id_pendamping?.toString());
            const paId = partByIdTkmMap.get(r.id_tkm.toString());
            if (paId) {
                 const reportId = uuidv4();
                 await pgClient.query('INSERT INTO monthly_reports (id, participant_id, mentor_id, legacy_tkm_id, report_month, report_year, bookkeeping_cashflow, bookkeeping_income_statement, sales_volume, sales_unit, production_capacity, production_unit, marketing_area, revenue, business_condition, obstacles, note_confirmation, lpj_status, is_verified, verification_note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) ON CONFLICT DO NOTHING',
                    [reportId, paId, meId, r.id_tkm?.toString(), r.month_report, 2024, r.bookkeeping_cashflow === 'T', r.bookkeeping_income_statement === 'T', r.sales_volume, r.sales_volume_unit, r.production_capacity, r.production_capacity_unit, r.marketing_area, r.revenue, r.business_condition, r.obstacle, r.note_confirmation, r.lpj === 'T', r.isverified, r.note_verified]);
                 
                 // Migrate proof documents
                 if (r.cashflow_proof_url) {
                     await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                         [uuidv4(), reportId, 'monthly_report', 'CASHFLOW_PROOF', r.cashflow_proof_url]);
                 }
                 if (r.income_proof_url) {
                     await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                         [uuidv4(), reportId, 'monthly_report', 'INCOME_PROOF', r.income_proof_url]);
                 }
            }
        }

        console.log('Migrating Upload Reports...');
        const [mUploads] = await mysqlConn.query('SELECT * FROM upload_report');
        for (const r of mUploads) {
            const urId = uuidv4();
            const adminUserId = r.admin_id ? userMap.get(r.admin_id.toString()) : null;
            await pgClient.query('INSERT INTO upload_reports (id, admin_user_id, note, verified, created_at, updated_at, legacy_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
                [urId, adminUserId, r.note, r.verified === 'T', r.created_at, r.updated_at, r.id]);
            if (r.link_report) {
                const docId = uuidv4();
                await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                    [docId, urId, 'upload_report', 'REPORT', r.link_report]);
                await pgClient.query('INSERT INTO upload_report_documents (document_id, upload_report_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [docId, urId]);
            }
        }

        console.log('Migrating Mentor Assignments...');
        const [mAss] = await mysqlConn.query('SELECT * FROM user_peserta');
        for (const a of mAss) {
            const meId = mentorMap.get(a.admin_id.toString());
            const paId = partByIdTkmMap.get(a.id_tkm.toString());
            if (meId && paId) {
                await pgClient.query('INSERT INTO mentor_participants (id, mentor_id, participant_id, legacy_tkm_id, assignment_status, batch_year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
                    [uuidv4(), meId, paId, a.id_tkm?.toString(), a.status_peserta, a.batch, a.created_at, a.updated_at]);
            }
        }

        console.log('Migrating Documents...');
        for (const p of mPeserta) {
            const paId = partMap.get(p.no.toString());
            const bId = businessMap.get(p.no.toString());
            if (paId) {
                const docs = [
                    { url: p.link_ktp, label: 'KTP', entity: 'participant', id: paId },
                    { url: p.upload_kartu_keluarga, label: 'KK', entity: 'participant', id: paId },
                    { url: p.link_pas_foto, label: 'PAS_FOTO', entity: 'participant', id: paId },
                    { url: p.link_video, label: 'VIDEO_PROFIL', entity: 'participant', id: paId },
                    { url: p.dokumen_surat_permohonan_bantuan, label: 'SURAT_PERMOHONAN', entity: 'participant', id: paId },
                    { url: p.dokumen_surat_pernyataan_kesanggupan, label: 'SURAT_KESANGGUPAN', entity: 'participant', id: paId },
                    { url: p.dokumen_profil_usaha, label: 'PROFIL_USAHA', entity: 'participant', id: paId },
                    { url: p.dokumen_bmc_strategi_model_usaha, label: 'BMC_STRATEGI', entity: 'participant', id: paId },
                    { url: p.dokumen_rab, label: 'RAB', entity: 'participant', id: paId },
                    { url: p.dokumen_rencana_pengembangan_usaha, label: 'RENCANA_PENGEMBANGAN', entity: 'participant', id: paId },
                    { url: p.lpj_tkm_pemula_2024, label: 'LPJ_2024', entity: 'participant', id: paId },
                    { url: p.bast_tkm_pemula_2024, label: 'BAST_2024', entity: 'participant', id: paId },
                    { url: p.dokumentasi_usaha_tkm_pemula_2024, label: 'DOKUMENTASI_USAHA', entity: 'participant', id: paId },
                    { url: p.dokumen_nib, label: 'NIB', entity: 'business', id: bId },
                    { url: p.dokumen_legalitas, label: 'LEGALITAS', entity: 'business', id: bId },
                    { url: p.dokumen_sku, label: 'SKU', entity: 'business', id: bId },
                    { url: p.foto_usaha, label: 'FOTO_USAHA', entity: 'business', id: bId }
                ];

                for (const d of docs) {
                    if (d.url && d.id) {
                        const docId = uuidv4();
                        await pgClient.query('INSERT INTO documents (id, entity_id, entity_type, label, file_url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', 
                            [docId, d.id, d.entity, d.label, d.url]);
                        
                        if (d.entity === 'participant') {
                            await pgClient.query('INSERT INTO participant_documents (document_id, participant_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [docId, d.id]);
                        } else if (d.entity === 'business') {
                            await pgClient.query('INSERT INTO business_documents (document_id, business_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [docId, d.id]);
                        }
                    }
                }
            }
        }

        console.log('--- Migration Done ---');
    } catch (err) {
        console.error('FAILED:', err);
    } finally {
        await mysqlConn.end();
        await pgClient.end();
    }
}
migrate();
