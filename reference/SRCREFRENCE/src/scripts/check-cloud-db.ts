import { cloudDb } from '../lib/db';

async function checkCloudDb() {
    console.log('Connecting to Cloud DB...');
    try {
        const [rows]: any = await cloudDb.query('SELECT 1 as val');
        console.log('Connected to Cloud DB. Result:', rows);

        console.log('Querying consolidated_transactions...');
        const [salesRows]: any = await cloudDb.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count 
            FROM consolidated_transactions 
            WHERE trx_date_local >= CURDATE()
        `);
        console.log('Sales Data:', salesRows[0]);

    } catch (error) {
        console.error('Error checking Cloud DB:', error);
    } finally {
        await cloudDb.end();
    }
}

checkCloudDb();
