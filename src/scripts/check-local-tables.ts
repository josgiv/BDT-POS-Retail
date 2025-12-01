import { localDb } from '../lib/db';

async function checkTables() {
    const client = await localDb.connect();
    try {
        console.log("Connected to Local DB:", process.env.POSTGRES_DB);
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables:", res.rows.map(r => r.table_name));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkTables();
