const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    try {
        const c = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        
        console.log('--- University Relation Summary (Legacy) ---');
        
        // Count users (mentors) per university
        const [mentors] = await c.query(`
            SELECT u.name as univ_name, count(p.user_id) as mentor_count
            FROM universities u
            LEFT JOIN profiles p ON u.id = p.univ_id
            GROUP BY u.id, u.name
            HAVING mentor_count > 0
            ORDER BY mentor_count DESC
        `);
        console.log('\nMentors per University:');
        mentors.forEach(m => console.log(`${m.univ_name}: ${m.mentor_count}`));
        
        // Check if there are participants (peserta) linked to universities
        const [peserta] = await c.query(`
            SELECT u.name as univ_name, count(ps.no) as participant_count
            FROM universities u
            JOIN profiles pr ON u.id = pr.univ_id
            JOIN user_peserta up ON pr.user_id = up.admin_id
            JOIN peserta ps ON up.id_tkm = ps.id_tkm
            GROUP BY u.id, u.name
            ORDER BY participant_count DESC
        `);
        console.log('\nParticipants (TKM) per University (via Mentor):');
        peserta.forEach(p => console.log(`${p.univ_name}: ${p.participant_count}`));

        await c.end();
    } catch (e) {
        console.error(e);
    }
}
main();
