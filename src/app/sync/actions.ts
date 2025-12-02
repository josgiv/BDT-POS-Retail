'use server';

import { localDb, cloudDb } from '@/lib/db';
import { Transaction } from '@/types';

export async function getUnsyncedTransactionsAction(): Promise<Transaction[]> {
    const client = await localDb.connect();
    try {
        // Fetch from Upload Queue
        const res = await client.query(`
            SELECT payload 
            FROM upload_queue 
            WHERE status = 'PENDING' AND table_name = 'transactions' 
            LIMIT 10
        `);

        const transactions: Transaction[] = res.rows.map(row => row.payload);
        return transactions;
    } catch (error) {
        console.error('Error fetching unsynced transactions:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function syncTransactionToCloudAction(transaction: Transaction): Promise<boolean> {
    try {
        // Using MySQL (TiDB)
        const connection = await cloudDb.getConnection();
        try {
            await connection.beginTransaction();

            // Insert Transaction into Consolidated Table
            await connection.execute(
                `INSERT INTO consolidated_transactions 
                (transaction_uuid, branch_id, shift_id, total_amount, payment_method, trx_date_local, 
                 subtotal, total_discount, tax_amount, cash_received, change_returned, user_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transaction.transaction_uuid,
                    transaction.branch_id,
                    transaction.shift_id,
                    transaction.grand_total, // total_amount
                    transaction.payment_method,
                    new Date(transaction.created_at),
                    transaction.subtotal,
                    transaction.total_discount,
                    transaction.tax_amount,
                    transaction.cash_received || 0,
                    transaction.change_returned || 0,
                    transaction.user_id,
                    new Date(transaction.created_at)
                ]
            );

            // Insert Items into Consolidated Items
            for (const item of transaction.items) {
                await connection.execute(
                    `INSERT INTO consolidated_items (transaction_uuid, product_id, qty, final_price, subtotal, product_name, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        transaction.transaction_uuid,
                        item.product_id,
                        item.qty,
                        item.price, // final_price
                        item.subtotal,
                        item.name, // product_name
                        item.category // category
                    ]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error syncing transaction to cloud:', error);
            return false;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Cloud DB Connection Error:', error);
        return false;
    }
}

export async function markTransactionSyncedAction(uuid: string): Promise<boolean> {
    const client = await localDb.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Upload Queue
        await client.query(
            "UPDATE retail_jakarta.upload_queue SET status = 'COMPLETED' WHERE record_uuid = $1",
            [uuid]
        );

        // 2. Update Transaction Table (for local UI feedback)
        await client.query(
            'UPDATE retail_jakarta.transactions SET synced = true WHERE transaction_uuid = $1',
            [uuid]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error marking transaction as synced:', error);
        return false;
    } finally {
        client.release();
    }
}
