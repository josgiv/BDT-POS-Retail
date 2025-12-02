import { cloudDb } from '../lib/db';

async function checkCloudSchema() {
    console.log('Connecting to Cloud DB (TiDB)...');
    const connection = await cloudDb.getConnection();
    try {
        console.log('\n--- Table: consolidated_transactions ---');
        const [trxCols]: any = await connection.execute(`DESCRIBE consolidated_transactions`);
        console.table(trxCols);

        console.log('\n--- Table: consolidated_items ---');
        const [itemCols]: any = await connection.execute(`DESCRIBE consolidated_items`);
        console.table(itemCols);

    } catch (error) {
        console.error('Error querying Cloud DB Schema:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

checkCloudSchema();
