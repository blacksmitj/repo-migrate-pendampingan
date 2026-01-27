const { Client } = require('pg');
require('dotenv').config();

// Usage: node view_participant.js [id_tkm]
// Example: node view_participant.js 12345

async function getParticipantDetail(idTkm) {
    const pg = new Client({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE
    });
    await pg.connect();

    // Build query based on whether idTkm is provided
    let query;
    let params = [];
    
    if (idTkm) {
        query = `
            SELECT 
                p.id,
                p.legacy_tkm_id,
                p.status,
                p.last_education,
                p.disability_status,
                p.current_activity,
                p.fund_disbursement,
                p.communication_status,
                p.status_applicant,
                pr.id_number as nik,
                pr.whatsapp_number,
                pr.gender,
                pr.pob as tempat_lahir,
                pr.dob as tanggal_lahir
            FROM participants p
            LEFT JOIN profiles pr ON p.profile_id = pr.id
            WHERE p.legacy_tkm_id = $1
        `;
        params = [idTkm];
    } else {
        query = `
            SELECT 
                p.id,
                p.legacy_tkm_id,
                p.status,
                p.last_education,
                p.disability_status,
                p.current_activity,
                p.fund_disbursement,
                p.communication_status,
                p.status_applicant,
                pr.id_number as nik,
                pr.whatsapp_number,
                pr.gender,
                pr.pob as tempat_lahir,
                pr.dob as tanggal_lahir
            FROM participants p
            LEFT JOIN profiles pr ON p.profile_id = pr.id
            LIMIT 1
        `;
    }

    const { rows } = await pg.query(query, params);
    
    if (rows.length === 0) {
        console.log('\n❌ Peserta dengan ID TKM "' + idTkm + '" tidak ditemukan.\n');
        await pg.end();
        return;
    }

    const participant = rows[0];

    console.log('\n========== DATA PESERTA ==========');
    console.log('UUID:', participant.id);
    console.log('ID TKM:', participant.legacy_tkm_id);
    console.log('NIK:', participant.nik);
    console.log('Gender:', participant.gender);
    console.log('Tempat/Tgl Lahir:', participant.tempat_lahir, '/', participant.tanggal_lahir);
    console.log('WhatsApp:', participant.whatsapp_number);
    console.log('Status:', participant.status);
    console.log('Pendidikan Terakhir:', participant.last_education);
    console.log('Status Pencairan:', participant.fund_disbursement);
    console.log('Status Komunikasi:', participant.communication_status);

    // Get Business
    const { rows: businesses } = await pg.query(`
        SELECT name, sector, type, main_product, nib_number, revenue_per_period
        FROM businesses WHERE participant_id = $1
    `, [participant.id]);

    console.log('\n========== DATA USAHA ==========');
    if (businesses.length > 0) {
        const b = businesses[0];
        console.log('Nama Usaha:', b.name);
        console.log('Sektor:', b.sector);
        console.log('Jenis:', b.type);
        console.log('Produk Utama:', b.main_product);
        console.log('No. NIB:', b.nib_number);
        console.log('Omset/Periode:', b.revenue_per_period);
    } else {
        console.log('(Tidak ada data usaha)');
    }

    // Get Documents
    const { rows: docs } = await pg.query(`
        SELECT label, file_url 
        FROM documents 
        WHERE entity_id = $1 AND entity_type = 'participant'
    `, [participant.id]);

    console.log('\n========== DOKUMEN PESERTA ==========');
    if (docs.length > 0) {
        docs.forEach(d => console.log(`- ${d.label}: ${d.file_url?.substring(0, 50)}...`));
    } else {
        console.log('(Tidak ada dokumen)');
    }

    // Get Monthly Reports
    const { rows: reports } = await pg.query(`
        SELECT report_month, report_year, revenue, business_condition, is_verified, lpj_status
        FROM monthly_reports 
        WHERE participant_id = $1
        ORDER BY report_year, report_month
        LIMIT 5
    `, [participant.id]);

    console.log('\n========== LAPORAN BULANAN (5 terakhir) ==========');
    if (reports.length > 0) {
        reports.forEach(r => console.log(`- ${r.report_month}/${r.report_year}: Revenue ${r.revenue}, LPJ: ${r.lpj_status ? 'Ya' : 'Tidak'}, Status: ${r.is_verified}`));
    } else {
        console.log('(Tidak ada laporan bulanan)');
    }

    // Get Logbooks
    const { rows: logs } = await pg.query(`
        SELECT activity_date, meeting_type, activity_summary, is_verified
        FROM logbooks 
        WHERE participant_id = $1
        ORDER BY activity_date DESC
        LIMIT 5
    `, [participant.id]);

    console.log('\n========== LOGBOOK PENDAMPINGAN (5 terakhir) ==========');
    if (logs.length > 0) {
        logs.forEach(l => console.log(`- ${l.activity_date}: ${l.meeting_type} - ${l.activity_summary?.substring(0, 40)}...`));
    } else {
        console.log('(Tidak ada logbook)');
    }

    // Get Mentor Assignment
    const { rows: mentors } = await pg.query(`
        SELECT u.username, u.email, mp.assignment_status
        FROM mentor_participants mp
        JOIN mentors m ON mp.mentor_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE mp.participant_id = $1
    `, [participant.id]);

    console.log('\n========== PENDAMPING ==========');
    if (mentors.length > 0) {
        mentors.forEach(m => console.log(`- ${m.username} (${m.email}) - Status: ${m.assignment_status}`));
    } else {
        console.log('(Belum ada pendamping)');
    }
    
    // Get University Pendamping
    const { rows: univs } = await pg.query(`
        SELECT u.name, u.city 
        FROM participants p
        JOIN universities u ON p.university_id = u.id
        WHERE p.id = $1
    `, [participant.id]);

    console.log('\n========== UNIVERSITAS PENDAMPING ==========');
    if (univs.length > 0) {
        const u = univs[0];
        console.log(`- ${u.name} (${u.city})`);
    } else {
        console.log('(Belum ada universitas pendamping)');
    }

    // Get Emergency Contacts
    const { rows: contacts } = await pg.query(`
        SELECT full_name, phone_number, relationship
        FROM emergency_contacts 
        WHERE participant_id = $1
    `, [participant.id]);

    console.log('\n========== KONTAK DARURAT ==========');
    if (contacts.length > 0) {
        contacts.forEach(c => console.log(`- ${c.full_name} (${c.relationship}): ${c.phone_number}`));
    } else {
        console.log('(Tidak ada kontak darurat)');
    }

    console.log('\n=====================================\n');

    await pg.end();
}

// Get ID TKM from command line argument
const idTkm = process.argv[2];
getParticipantDetail(idTkm);
