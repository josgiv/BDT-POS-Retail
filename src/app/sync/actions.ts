'use server';

import { localDb, cloudDb } from '@/lib/db';
import { Transaction } from '@/types';

export async function getUnsyncedTransactionsAction(): Promise<Transaction[]> {
    const client = await localDb.connect();
    try {
        // Fetch transactions
        const res = await client.query('SELECT * FROM transactions WHERE synced = false LIMIT 10');
        const transactions: Transaction[] = [];

        for (const row of res.rows) {
            // Fetch items for each transaction
            const itemsRes = await client.query('SELECT * FROM transaction_items WHERE transaction_uuid = $1', [row.transaction_uuid]);

            transactions.push({
                transaction_uuid: row.transaction_uuid,
                branch_id: row.branch_id,
                shift_id: row.shift_id,
                user_id: row.user_id,
                subtotal: parseFloat(row.subtotal),
                total_discount: parseFloat(row.total_discount),
                tax_amount: parseFloat(row.tax_amount),
                grand_total: parseFloat(row.grand_total),
                payment_method: row.payment_method,
                created_at: row.created_at,
                synced: row.synced,
                items: itemsRes.rows.map(item => ({
                    product_id: item.product_id,
                    barcode: '', // Not strictly needed for sync unless cloud needs it, but we can join if needed
                    name: '', // Same
                    price: parseFloat(item.price),
                    qty: item.qty,
                    subtotal: parseFloat(item.subtotal),
                    stock: 0 // Not relevant here
                }))
            });
        }
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

            // Insert Transaction
            await connection.execute(
                `INSERT INTO transactions 
                (transaction_uuid, branch_id, shift_id, user_id, subtotal, total_discount, tax_amount, grand_total, payment_method, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transaction.transaction_uuid,
                    transaction.branch_id,
                    transaction.shift_id,
                    transaction.user_id,
                    transaction.subtotal,
                    transaction.total_discount,
                    transaction.tax_amount,
                    transaction.grand_total,
                    transaction.payment_method,
                    new Date(transaction.created_at)
                ]
            );

            // Insert Items
            for (const item of transaction.items) {
                await connection.execute(
                    `INSERT INTO transaction_items (transaction_uuid, product_id, qty, price, subtotal)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        transaction.transaction_uuid,
                        item.product_id,
                        item.qty,
                        item.price,
                        item.subtotal
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
        await client.query('UPDATE transactions SET synced = true WHERE transaction_uuid = $1', [uuid]);
        return true;
    } catch (error) {
        console.error('Error marking transaction as synced:', error);
        return false;
    } finally {
        client.release();
    }
}
