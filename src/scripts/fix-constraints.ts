import { localDb } from '../lib/db';

async function fixConstraints() {
    console.log('Connecting to local DB...');
    const client = await localDb.connect();
    try {
        console.log('Dropping constraints...');

        // Drop transaction_items product_id constraint
        await client.query(`
            ALTER TABLE retail_jakarta.transaction_items 
            DROP CONSTRAINT IF EXISTS transaction_items_product_id_fkey;
        `);
        console.log('Dropped transaction_items_product_id_fkey');

        // Drop transactions user_id constraint
        await client.query(`
            ALTER TABLE retail_jakarta.transactions 
            DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
        `);
        console.log('Dropped transactions_user_id_fkey');

        // Drop transactions shift_id constraint
        await client.query(`
            ALTER TABLE retail_jakarta.transactions 
            DROP CONSTRAINT IF EXISTS transactions_shift_id_fkey;
        `);
        console.log('Dropped transactions_shift_id_fkey');

        console.log('✅ All constraints dropped successfully!');
    } catch (error) {
        console.error('Error dropping constraints:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

fixConstraints();
