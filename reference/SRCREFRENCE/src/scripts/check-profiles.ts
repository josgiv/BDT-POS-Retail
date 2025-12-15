import { identityDb } from '../lib/db';

async function checkProfiles() {
    console.log('Connecting to Identity DB...');
    const client = await identityDb.connect();
    try {
        console.log('Connected. Searching for AREA_MANAGER...');
        const res = await client.query(`
            SELECT id, username, role, branch_id 
            FROM retail_identity.profiles 
            WHERE role = 'AREA_MANAGER'
        `);
        if (res.rows.length > 0) {
            console.log('AM User Found:', res.rows[0]);
        } else {
            console.log('No AREA_MANAGER found. Listing all roles...');
            const roles = await client.query('SELECT DISTINCT role FROM retail_identity.profiles');
            console.table(roles.rows);
        }
    } catch (error) {
        console.error('Error checking profiles:', error);
    } finally {
        client.release();
        await identityDb.end();
    }
}

checkProfiles();
