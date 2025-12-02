'use server';

import { localDb } from '@/lib/db';
import { Product, Transaction } from '@/types';
import { syncTransactionToCloudAction, markTransactionSyncedAction } from '@/app/sync/actions';

export async function getProductsAction(): Promise<Product[]> {
    const client = await localDb.connect();
    try {
        const res = await client.query('SELECT * FROM products_local');
        return res.rows;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function getProductByBarcodeAction(barcode: string): Promise<Product | undefined> {
    const client = await localDb.connect();
    try {
        const res = await client.query('SELECT * FROM products_local WHERE barcode = $1', [barcode]);
        return res.rows[0];
    } catch (error) {
        console.error('Error fetching product by barcode:', error);
        return undefined;
    } finally {
        client.release();
    }
}

export async function saveTransactionAction(transaction: Transaction): Promise<boolean> {
    const client = await localDb.connect();
    try {
        await client.query('BEGIN');

        // 1. Lookup User ID if email is provided
        let userId = transaction.user_id;
        if (!userId && transaction.user_email) {
            const userRes = await client.query('SELECT user_id FROM users_local WHERE email = $1', [transaction.user_email]);
            if (userRes.rows.length > 0) {
                userId = userRes.rows[0].user_id;
            } else {
                // Optional: Insert dummy user or handle error. For now, log warning.
                console.warn(`User with email ${transaction.user_email} not found in users_local.`);
            }
        }

        // 2. Insert Transaction Header
        await client.query(
            `INSERT INTO retail_jakarta.transactions 
            (transaction_uuid, branch_id, shift_id, user_id, subtotal, total_discount, tax_amount, grand_total, payment_method, created_at, synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                transaction.transaction_uuid,
                transaction.branch_id,
                null, // Shift ID handled separately or nullable
                userId, // Use looked-up User ID
                transaction.subtotal,
                transaction.total_discount,
                transaction.tax_amount,
                transaction.grand_total,
                transaction.payment_method,
                transaction.created_at,
                false // synced
            ]
        );

        // 3. Insert Items
        for (const item of transaction.items) {
            // Ensure product exists in local DB to avoid FK error or "Unknown Product"
            // We try to update the name if it exists, or insert if missing (though addProductAction should handle this)
            // For robustness, we can update the product name here if we have it from the cart
            if (item.name) {
                await client.query(
                    `INSERT INTO retail_jakarta.products_local (product_id, barcode, name, price, category)
                     VALUES ($1, $2, $3, $4, 'Uncategorized')
                     ON CONFLICT (product_id) DO UPDATE SET name = $3`,
                    [item.product_id, item.barcode, item.name, item.price]
                );
            }

            await client.query(
                `INSERT INTO retail_jakarta.transaction_items (transaction_uuid, product_id, qty, price_at_sale, subtotal)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    transaction.transaction_uuid,
                    item.product_id,
                    item.qty,
                    item.price,
                    item.subtotal
                ]
            );

            // 4. Update Stock (Inventory Only)
            await client.query(
                `UPDATE retail_jakarta.inventory_local SET qty_on_hand = qty_on_hand - $1 WHERE product_id = $2`,
                [item.qty, item.product_id]
            );
        }

        // 5. Insert into Upload Queue (For Sync to Cloud)
        // We need to pass the updated transaction object with the correct user_id to the sync queue
        const transactionToSync = { ...transaction, user_id: userId };

        await client.query(
            `INSERT INTO retail_jakarta.upload_queue (table_name, record_uuid, operation, payload, status)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                'transactions',
                transaction.transaction_uuid,
                'INSERT',
                JSON.stringify(transactionToSync),
                'PENDING'
            ]
        );

        await client.query('COMMIT');

        // 6. TRIGGER INSTANT SYNC
        try {
            console.log('[InstantSync] Starting sync for:', transaction.transaction_uuid);
            const synced = await syncTransactionToCloudAction(transactionToSync);
            if (synced) {
                await markTransactionSyncedAction(transaction.transaction_uuid);
                console.log('[InstantSync] Success:', transaction.transaction_uuid);
            } else {
                console.warn('[InstantSync] Failed to sync to cloud immediately.');
            }
        } catch (syncError) {
            console.error('[InstantSync] Error during instant sync:', syncError);
        }

        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving transaction:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function getTransactionDetailsAction(transactionUuid: string): Promise<any[]> {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
            SELECT 
                ti.*,
                p.name as product_name,
                p.category
            FROM retail_jakarta.transaction_items ti
            LEFT JOIN retail_jakarta.products_local p ON ti.product_id = p.product_id
            WHERE ti.transaction_uuid = $1
        `, [transactionUuid]);
        return res.rows;
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function getTransactionsAction(): Promise<any[]> {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
            SELECT * FROM retail_jakarta.transactions 
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        return res.rows;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    } finally {
        client.release();
    }
}

export async function addProductAction(product: Product): Promise<boolean> {
    const client = await localDb.connect();
    try {
        await client.query(
            `INSERT INTO products_local (product_id, barcode, name, price, category)
            VALUES ($1, $2, $3, $4, $6)
            ON CONFLICT (barcode) DO UPDATE 
            SET price = $4, name = $3, category = $6`,
            [
                product.product_id || Math.floor(Math.random() * 100000),
                product.barcode,
                product.name,
                product.price,
                product.stock, // Not used in insert if table doesn't have stock column, but let's keep for now
                product.category
            ]
        );
        return true;
    } catch (error) {
        console.error('Error adding product:', error);
        return false;
    } finally {
        client.release();
    }
}

export async function logDefectiveAction(barcode: string, qty: number, reason: string): Promise<boolean> {
    const client = await localDb.connect();
    try {
        await client.query('BEGIN');

        // 1. Reduce Stock (Inventory Local)
        const res = await client.query(
            `UPDATE inventory_local i
             SET qty_on_hand = qty_on_hand - $1 
             FROM products_local p
             WHERE i.product_id = p.product_id AND p.barcode = $2 
             RETURNING p.product_id, p.name`,
            [qty, barcode]
        );

        if (res.rows.length === 0) {
            throw new Error('Product not found in inventory');
        }

        const product = res.rows[0];

        // 2. Log Defective
        await client.query(`
            CREATE TABLE IF NOT EXISTS defective_log (
                id SERIAL PRIMARY KEY,
                product_id INT,
                name VARCHAR(255),
                qty INT,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(
            `INSERT INTO defective_log (product_id, name, qty, reason) VALUES ($1, $2, $3, $4)`,
            [product.product_id, product.name, qty, reason]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error logging defective item:', error);
        return false;
    } finally {
        client.release();
    }
}
