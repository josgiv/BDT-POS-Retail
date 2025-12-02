import { cloudDb } from '../lib/db';

async function checkCloudData() {
    console.log('Connecting to Cloud DB (TiDB)...');
    const connection = await cloudDb.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT transaction_uuid, total_amount, payment_method, trx_date_local 
             FROM consolidated_transactions 
             ORDER BY trx_date_local DESC 
             LIMIT 5`
        );

        console.log('\n[TiDB] Latest 5 Transactions:');
        console.table(rows);

        const [count]: any = await connection.execute(
            `SELECT COUNT(*) as total FROM consolidated_transactions`
        );
        console.log(`\n[TiDB] Total Transactions: ${count[0].total}`);

    } catch (error) {
        console.error('Error querying Cloud DB:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

checkCloudData();
