'use server';

import { localDb } from '@/lib/db';
import { Product, Transaction } from '@/types';
import { syncTransactionToCloudAction, markTransactionSyncedAction } from '@/app/sync/actions';

// Helper to determine schema based on branch ID
function getSchemaForBranch(branchId: string | number): string {
    const id = String(branchId);
    switch (id) {
        case '101': return 'retail_jakarta';
        case '102': return 'retail_bandung';
        case '103': return 'retail_surabaya';
        default: return 'retail_jakarta'; // Fallback or throw error
    }
}

export async function getProductsAction(branchId: string = '101'): Promise<Product[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`SELECT * FROM ${schema}.products_local`);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching products from ${schema}:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function getProductByBarcodeAction(barcode: string, branchId: string = '101'): Promise<Product | undefined> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`SELECT * FROM ${schema}.products_local WHERE barcode = $1`, [barcode]);
        return res.rows[0];
    } catch (error) {
        console.error(`Error fetching product by barcode from ${schema}:`, error);
        return undefined;
    } finally {
        client.release();
    }
}

export async function saveTransactionAction(transaction: Transaction): Promise<boolean> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(transaction.branch_id);

    try {
        await client.query('BEGIN');

        // 1. Lookup User ID
        let userId = transaction.user_id;

        // Try looking up by username first (more reliable for local users)
        if (!userId && transaction.username) {
            const userRes = await client.query(`SELECT user_id FROM ${schema}.users_local WHERE username = $1`, [transaction.username]);
            if (userRes.rows.length > 0) {
                userId = userRes.rows[0].user_id;
            }
        }

        // Fallback to email if username didn't work
        if (!userId && transaction.user_email) {
            // Note: users_local might be in the specific schema or public. 
            // Assuming users are replicated to each branch schema or in a shared schema.
            // If users are global, they might be in public.users_local? 
            // Let's assume they are in the branch schema for now as per "distributed" nature.
            try {
                await client.query('SAVEPOINT email_lookup');
                const userRes = await client.query(`SELECT user_id FROM ${schema}.users_local WHERE email = $1`, [transaction.user_email]);
                if (userRes.rows.length > 0) {
                    userId = userRes.rows[0].user_id;
                }
                await client.query('RELEASE SAVEPOINT email_lookup');
            } catch (e) {
                await client.query('ROLLBACK TO SAVEPOINT email_lookup');
                console.warn(`Could not lookup user by email in ${schema}.users_local (column might be missing):`, e);
            }
        }

        if (!userId && (transaction.username || transaction.user_email)) {
            console.warn(`User ${transaction.username || transaction.user_email} not found in ${schema}.users_local.`);
        }

        // 2. Insert Transaction Header
        await client.query(
            `INSERT INTO ${schema}.transactions 
            (transaction_uuid, branch_id, shift_id, user_id, subtotal, total_discount, tax_amount, grand_total, payment_method, created_at, synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                transaction.transaction_uuid,
                transaction.branch_id,
                null,
                userId,
                transaction.subtotal,
                transaction.total_discount,
                transaction.tax_amount,
                transaction.grand_total,
                transaction.payment_method,
                transaction.created_at,
                false
            ]
        );

        // 3. Insert Items
        for (const item of transaction.items) {
            if (item.name) {
                await client.query(
                    `INSERT INTO ${schema}.products_local (product_id, barcode, name, price, category)
                     VALUES ($1, $2, $3, $4, 'Uncategorized')
                     ON CONFLICT (product_id) DO UPDATE SET name = $3`,
                    [item.product_id, item.barcode, item.name, item.price]
                );
            }

            await client.query(
                `INSERT INTO ${schema}.transaction_items (transaction_uuid, product_id, qty, price_at_sale, subtotal)
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
                `UPDATE ${schema}.inventory_local SET qty_on_hand = qty_on_hand - $1 WHERE product_id = $2`,
                [item.qty, item.product_id]
            );
        }

        // 5. Insert into Upload Queue
        const transactionToSync = { ...transaction, user_id: userId };

        await client.query(
            `INSERT INTO ${schema}.upload_queue (table_name, record_uuid, operation, payload, status)
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
        console.error(`Error saving transaction to ${schema}:`, error);
        throw error;
    } finally {
        client.release();
    }
}

export async function getTransactionDetailsAction(transactionUuid: string, branchId: string = '101'): Promise<any[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT 
                ti.*,
                p.name as product_name,
                p.category
            FROM ${schema}.transaction_items ti
            LEFT JOIN ${schema}.products_local p ON ti.product_id = p.product_id
            WHERE ti.transaction_uuid = $1
        `, [transactionUuid]);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching transaction details from ${schema}:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function getTransactionsAction(branchId: string = '101'): Promise<any[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT * FROM ${schema}.transactions 
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching transactions from ${schema}:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function addProductAction(product: Product, branchId: string = '101'): Promise<boolean> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        await client.query(
            `INSERT INTO ${schema}.products_local (product_id, barcode, name, price, category)
            VALUES ($1, $2, $3, $4, $6)
            ON CONFLICT (barcode) DO UPDATE 
            SET price = $4, name = $3, category = $6`,
            [
                product.product_id || Math.floor(Math.random() * 100000),
                product.barcode,
                product.name,
                product.price,
                product.stock,
                product.category
            ]
        );
        return true;
    } catch (error) {
        console.error(`Error adding product to ${schema}:`, error);
        return false;
    } finally {
        client.release();
    }
}

export async function logDefectiveAction(barcode: string, qty: number, reason: string, branchId: string = '101'): Promise<boolean> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        await client.query('BEGIN');

        // 1. Reduce Stock (Inventory Local)
        const res = await client.query(
            `UPDATE ${schema}.inventory_local i
             SET qty_on_hand = qty_on_hand - $1 
             FROM ${schema}.products_local p
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
            CREATE TABLE IF NOT EXISTS ${schema}.defective_log (
                id SERIAL PRIMARY KEY,
                product_id INT,
                name VARCHAR(255),
                qty INT,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(
            `INSERT INTO ${schema}.defective_log (product_id, name, qty, reason) VALUES ($1, $2, $3, $4)`,
            [product.product_id, product.name, qty, reason]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error logging defective item in ${schema}:`, error);
        return false;
    } finally {
        client.release();
    }
}
