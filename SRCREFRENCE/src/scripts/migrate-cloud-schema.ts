import { cloudDb } from '../lib/db';

async function migrateCloudSchema() {
    console.log('Connecting to Cloud DB (TiDB)...');
    const connection = await cloudDb.getConnection();
    try {
        // 1. Add columns to consolidated_transactions
        console.log('Migrating consolidated_transactions...');

        const queries = [
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS total_discount DECIMAL(15, 2)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15, 2)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS cash_received DECIMAL(15, 2)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS change_returned DECIMAL(15, 2)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)",
            "ALTER TABLE consolidated_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ];

        for (const query of queries) {
            try {
                await connection.execute(query);
                console.log(`Executed: ${query}`);
            } catch (e: any) {
                console.log(`Skipped (or error): ${e.message}`);
            }
        }

        // 2. Add columns to consolidated_items
        console.log('Migrating consolidated_items...');
        // We might want product name snapshot
        const itemQueries = [
            "ALTER TABLE consolidated_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)",
            "ALTER TABLE consolidated_items ADD COLUMN IF NOT EXISTS category VARCHAR(50)"
        ];

        for (const query of itemQueries) {
            try {
                await connection.execute(query);
                console.log(`Executed: ${query}`);
            } catch (e: any) {
                console.log(`Skipped (or error): ${e.message}`);
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Error migrating Cloud DB:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrateCloudSchema();
