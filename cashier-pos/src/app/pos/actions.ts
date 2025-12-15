'use server';

import { localDb, cloudDb, getSchemaForBranch } from '@/lib/db';
import type { Product, Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getProductsAction(branchId: string = '101'): Promise<Product[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`SELECT * FROM ${schema}.products_local WHERE is_active = true`);
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

export async function searchProductsAction(query: string, branchId: string = '101'): Promise<Product[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(
            `SELECT * FROM ${schema}.products_local 
             WHERE (name ILIKE $1 OR barcode ILIKE $1) AND is_active = true 
             LIMIT 20`,
            [`%${query}%`]
        );
        return res.rows;
    } catch (error) {
        console.error(`Error searching products:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function saveTransactionAction(transaction: Transaction): Promise<{ success: boolean; error?: string }> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(transaction.branch_id);

    try {
        await client.query('BEGIN');

        // Generate UUID if not provided
        const transactionUuid = transaction.transaction_uuid || uuidv4();

        // 1. Insert Transaction Header
        await client.query(
            `INSERT INTO ${schema}.transactions 
            (transaction_uuid, branch_id, shift_id, user_id, subtotal, total_discount, tax_amount, grand_total, payment_method, cash_received, change_returned, created_at, synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                transactionUuid,
                transaction.branch_id,
                transaction.shift_id,
                transaction.user_id,
                transaction.subtotal,
                transaction.total_discount,
                transaction.tax_amount,
                transaction.grand_total,
                transaction.payment_method,
                transaction.cash_received || 0,
                transaction.change_returned || 0,
                transaction.created_at,
                false
            ]
        );

        // 2. Insert Transaction Items
        for (const item of transaction.items) {
            await client.query(
                `INSERT INTO ${schema}.transaction_items (transaction_uuid, product_id, qty, price_at_sale, subtotal)
                VALUES ($1, $2, $3, $4, $5)`,
                [transactionUuid, item.product_id, item.qty, item.price, item.subtotal]
            );

            // 3. Update Inventory
            await client.query(
                `UPDATE ${schema}.inventory_local SET qty_on_hand = qty_on_hand - $1 WHERE product_id = $2`,
                [item.qty, item.product_id]
            );
        }

        // 4. Add to Upload Queue for Sync
        await client.query(
            `INSERT INTO ${schema}.upload_queue (table_name, record_uuid, operation, payload, status)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                'transactions',
                transactionUuid,
                'INSERT',
                JSON.stringify({ ...transaction, transaction_uuid: transactionUuid }),
                'PENDING'
            ]
        );

        await client.query('COMMIT');

        // 5. Trigger Instant Sync (fire and forget)
        syncTransactionToCloud({ ...transaction, transaction_uuid: transactionUuid }).catch(console.error);

        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error saving transaction to ${schema}:`, error);
        return { success: false, error: 'Gagal menyimpan transaksi' };
    } finally {
        client.release();
    }
}

export async function getTransactionsAction(branchId: string = '101', limit: number = 50): Promise<Transaction[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT * FROM ${schema}.transactions 
            ORDER BY created_at DESC 
            LIMIT $1
        `, [limit]);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching transactions from ${schema}:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function logDefectiveAction(barcode: string, qty: number, reason: string, branchId: string = '101'): Promise<boolean> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        await client.query('BEGIN');

        // Get product info
        const productRes = await client.query(
            `SELECT p.product_id, p.name FROM ${schema}.products_local p WHERE p.barcode = $1`,
            [barcode]
        );

        if (productRes.rows.length === 0) {
            throw new Error('Product not found');
        }

        const product = productRes.rows[0];

        // Update inventory
        await client.query(
            `UPDATE ${schema}.inventory_local SET qty_on_hand = qty_on_hand - $1 WHERE product_id = $2`,
            [qty, product.product_id]
        );

        // Log defective
        await client.query(
            `INSERT INTO ${schema}.defective_log (product_id, name, qty, reason) VALUES ($1, $2, $3, $4)`,
            [product.product_id, product.name, qty, reason]
        );

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error logging defective item:`, error);
        return false;
    } finally {
        client.release();
    }
}

// Cloud sync function
async function syncTransactionToCloud(transaction: Transaction): Promise<boolean> {
    try {
        const connection = await cloudDb.getConnection();
        try {
            await connection.beginTransaction();

            // Ensure cloud tables exist
            await ensureCloudTablesExist(connection);

            // Insert Transaction
            await connection.execute(
                `INSERT INTO consolidated_transactions 
                (transaction_uuid, branch_id, shift_id, total_amount, payment_method, trx_date_local, 
                 subtotal, total_discount, tax_amount, cash_received, change_returned, user_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transaction.transaction_uuid,
                    transaction.branch_id,
                    transaction.shift_id,
                    transaction.grand_total,
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

            // Insert Items
            for (const item of transaction.items) {
                await connection.execute(
                    `INSERT INTO consolidated_items (transaction_uuid, product_id, qty, final_price, subtotal, product_name, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        transaction.transaction_uuid,
                        item.product_id,
                        item.qty,
                        item.price,
                        item.subtotal,
                        item.name,
                        item.category || 'Uncategorized'
                    ]
                );
            }

            await connection.commit();

            // Mark as synced in local DB
            await markTransactionSynced(transaction.transaction_uuid!, transaction.branch_id);

            console.log(`[CloudSync] Transaction ${transaction.transaction_uuid} synced successfully`);
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('[CloudSync] Error syncing transaction:', error);
            return false;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('[CloudSync] Connection error:', error);
        return false;
    }
}

async function ensureCloudTablesExist(connection: any): Promise<void> {
    const createTableQueries = [
        `CREATE TABLE IF NOT EXISTS consolidated_transactions (
            global_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            transaction_uuid VARCHAR(36) UNIQUE NOT NULL,
            branch_id INT NOT NULL,
            shift_id BIGINT,
            total_amount DECIMAL(15,2),
            payment_method VARCHAR(50),
            trx_date_local DATETIME,
            subtotal DECIMAL(15,2),
            total_discount DECIMAL(15,2),
            tax_amount DECIMAL(15,2),
            cash_received DECIMAL(15,2),
            change_returned DECIMAL(15,2),
            user_id BIGINT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS consolidated_items (
            item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            transaction_uuid VARCHAR(36),
            product_id BIGINT,
            qty INT,
            final_price DECIMAL(15,2),
            subtotal DECIMAL(15,2),
            product_name VARCHAR(200),
            category VARCHAR(50)
        )`,
        `CREATE TABLE IF NOT EXISTS products_mirror (
            mirror_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            branch_id INT NOT NULL,
            product_id BIGINT NOT NULL,
            barcode VARCHAR(50),
            name VARCHAR(200),
            price DECIMAL(15,2),
            category VARCHAR(50),
            stock INT DEFAULT 0,
            last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY (branch_id, product_id)
        )`,
        `CREATE TABLE IF NOT EXISTS defective_items_cloud (
            defective_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            branch_id INT NOT NULL,
            product_id BIGINT,
            product_name VARCHAR(200),
            qty INT,
            reason TEXT,
            reported_at TIMESTAMP,
            synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS sync_status (
            sync_id BIGINT AUTO_INCREMENT PRIMARY KEY,
            branch_id INT NOT NULL,
            table_name VARCHAR(50),
            last_sync_at TIMESTAMP,
            records_synced INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'SUCCESS'
        )`
    ];

    for (const query of createTableQueries) {
        try {
            await connection.execute(query);
        } catch (error: any) {
            // Ignore if table already exists
            if (!error.message.includes('already exists')) {
                console.warn('Table creation warning:', error.message);
            }
        }
    }
}

async function markTransactionSynced(uuid: string, branchId: number): Promise<void> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        await client.query(`UPDATE ${schema}.transactions SET synced = true WHERE transaction_uuid = $1`, [uuid]);
        await client.query(`UPDATE ${schema}.upload_queue SET status = 'COMPLETED' WHERE record_uuid = $1`, [uuid]);
    } finally {
        client.release();
    }
}

// ==================== TODAY'S TRANSACTIONS ====================

export async function getTodayTransactionsAction(branchId: string = '101'): Promise<any[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT 
                t.transaction_uuid,
                t.subtotal,
                t.tax_amount,
                t.grand_total,
                t.payment_method,
                t.cash_received,
                t.change_returned,
                t.created_at,
                t.synced
            FROM ${schema}.transactions t
            WHERE DATE(t.created_at) = CURRENT_DATE
            ORDER BY t.created_at DESC
        `);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching today's transactions:`, error);
        return [];
    } finally {
        client.release();
    }
}

export async function getTransactionItemsAction(transactionUuid: string, branchId: string = '101'): Promise<any[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT 
                ti.product_id,
                p.name as product_name,
                ti.qty,
                ti.price_at_sale,
                ti.subtotal
            FROM ${schema}.transaction_items ti
            LEFT JOIN ${schema}.products_local p ON ti.product_id = p.product_id
            WHERE ti.transaction_uuid = $1
        `, [transactionUuid]);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching transaction items:`, error);
        return [];
    } finally {
        client.release();
    }
}

// ==================== INVENTORY MANAGEMENT ====================

const ADMIN_PIN = '123456'; // Default SPV/Admin PIN

export async function verifyAdminPinAction(pin: string): Promise<{ success: boolean; error?: string }> {
    if (pin === ADMIN_PIN) {
        return { success: true };
    }
    return { success: false, error: 'PIN tidak valid' };
}

export async function getInventoryWithStockAction(branchId: string = '101'): Promise<any[]> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        // First try to get products with inventory
        const res = await client.query(`
            SELECT 
                p.product_id,
                p.barcode,
                p.name,
                p.category,
                p.price,
                COALESCE(i.qty_on_hand, 50) as qty_on_hand,
                5 as min_stock
            FROM ${schema}.products_local p
            LEFT JOIN ${schema}.inventory_local i ON p.product_id = i.product_id
            ORDER BY p.category NULLS LAST, p.name
        `);
        return res.rows;
    } catch (error) {
        console.error(`Error fetching inventory:`, error);
        // Fallback: just get products
        try {
            const fallback = await client.query(`
                SELECT 
                    product_id,
                    barcode,
                    name,
                    category,
                    price,
                    50 as qty_on_hand,
                    5 as min_stock
                FROM ${schema}.products_local
                ORDER BY category NULLS LAST, name
            `);
            return fallback.rows;
        } catch (e) {
            console.error('Fallback inventory query failed:', e);
            return [];
        }
    } finally {
        client.release();
    }
}

export async function updateProductStockAction(
    productId: number,
    newQty: number,
    branchId: string = '101',
    reason: string = 'Manual adjustment'
): Promise<{ success: boolean; error?: string }> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);

    try {
        await client.query('BEGIN');

        // 1. Update local inventory
        const existingRes = await client.query(
            `SELECT * FROM ${schema}.inventory_local WHERE product_id = $1`,
            [productId]
        );

        if (existingRes.rows.length === 0) {
            // Insert if not exists
            await client.query(
                `INSERT INTO ${schema}.inventory_local (product_id, qty_on_hand, min_stock, last_updated) 
                 VALUES ($1, $2, 5, NOW())`,
                [productId, newQty]
            );
        } else {
            // Update existing
            await client.query(
                `UPDATE ${schema}.inventory_local SET qty_on_hand = $1, last_updated = NOW() WHERE product_id = $2`,
                [newQty, productId]
            );
        }

        // 2. Add to upload queue for cloud sync
        await client.query(
            `INSERT INTO ${schema}.upload_queue (table_name, record_uuid, operation, payload, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                'inventory_update',
                `inv_${productId}_${Date.now()}`,
                'UPDATE',
                JSON.stringify({ product_id: productId, qty: newQty, branch_id: branchId, reason }),
                'PENDING'
            ]
        );

        await client.query('COMMIT');

        // 3. Sync to TiDB Cloud immediately (fire and forget)
        syncStockToCloud(productId, newQty, parseInt(branchId), reason).catch(console.error);

        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating stock:`, error);
        return { success: false, error: 'Gagal mengupdate stok' };
    } finally {
        client.release();
    }
}

async function syncStockToCloud(productId: number, qty: number, branchId: number, reason: string): Promise<void> {
    try {
        // Update or insert into TiDB cloud inventory tracking
        // Note: This creates a stock_adjustments log in TiDB
        await cloudDb.query(`
            INSERT INTO stock_adjustments (product_id, branch_id, adjustment_qty, reason, adjusted_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                adjustment_qty = adjustment_qty + VALUES(adjustment_qty),
                adjusted_at = NOW()
        `, [productId, branchId, qty, reason]);

        console.log(`Stock synced to cloud: product ${productId}, qty ${qty}`);
    } catch (error) {
        // If table doesn't exist, create it
        try {
            await cloudDb.query(`
                CREATE TABLE IF NOT EXISTS stock_adjustments (
                    adjustment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    product_id BIGINT NOT NULL,
                    branch_id INT NOT NULL,
                    adjustment_qty INT,
                    reason TEXT,
                    adjusted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_product_branch (product_id, branch_id)
                )
            `);
            // Retry insert
            await cloudDb.query(`
                INSERT INTO stock_adjustments (product_id, branch_id, adjustment_qty, reason, adjusted_at)
                VALUES (?, ?, ?, ?, NOW())
            `, [productId, branchId, qty, reason]);
        } catch (retryError) {
            console.error('Failed to sync stock to cloud:', retryError);
        }
    }
}

export async function getTodayStatsSummaryAction(branchId: string = '101'): Promise<{
    total_transactions: number;
    total_revenue: number;
    total_items_sold: number;
    avg_transaction: number;
}> {
    const client = await localDb.connect();
    const schema = getSchemaForBranch(branchId);
    try {
        const res = await client.query(`
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(grand_total), 0) as total_revenue,
                COALESCE(AVG(grand_total), 0) as avg_transaction
            FROM ${schema}.transactions
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const itemsRes = await client.query(`
            SELECT COALESCE(SUM(ti.qty), 0) as total_items
            FROM ${schema}.transaction_items ti
            JOIN ${schema}.transactions t ON ti.transaction_uuid = t.transaction_uuid
            WHERE DATE(t.created_at) = CURRENT_DATE
        `);

        return {
            total_transactions: parseInt(res.rows[0]?.total_transactions || 0),
            total_revenue: parseFloat(res.rows[0]?.total_revenue || 0),
            total_items_sold: parseInt(itemsRes.rows[0]?.total_items || 0),
            avg_transaction: parseFloat(res.rows[0]?.avg_transaction || 0)
        };
    } catch (error) {
        console.error(`Error fetching today's stats:`, error);
        return { total_transactions: 0, total_revenue: 0, total_items_sold: 0, avg_transaction: 0 };
    } finally {
        client.release();
    }
}

