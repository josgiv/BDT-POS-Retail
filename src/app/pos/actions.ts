'use server';

import { localDb } from '@/lib/db';
import { Product, Transaction } from '@/types';

export async function getProductsAction(): Promise<Product[]> {
    const client = await localDb.connect();
    try {
        const res = await client.query('SELECT * FROM products');
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
        const res = await client.query('SELECT * FROM products WHERE barcode = $1', [barcode]);
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

        // Insert Transaction
        await client.query(
            `INSERT INTO transactions 
            (transaction_uuid, branch_id, shift_id, user_id, subtotal, total_discount, tax_amount, grand_total, payment_method, created_at, synced)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
                transaction.created_at,
                false // synced
            ]
        );

        // Insert Items
        for (const item of transaction.items) {
            await client.query(
                `INSERT INTO transaction_items (transaction_uuid, product_id, qty, price, subtotal)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    transaction.transaction_uuid,
                    item.product_id,
                    item.qty,
                    item.price,
                    item.subtotal
                ]
            );

            // Update Stock
            await client.query(
                `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
                [item.qty, item.product_id]
            );
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving transaction:', error);
        throw error;
    } finally {
        client.release();
    }
}

export async function addProductAction(product: Product): Promise<boolean> {
    const client = await localDb.connect();
    try {
        await client.query(
            `INSERT INTO products (product_id, barcode, name, price, stock, category)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (barcode) DO UPDATE 
            SET stock = products.stock + $5, price = $4, name = $3, category = $6`,
            [
                product.product_id || Math.floor(Math.random() * 100000), // Generate ID if missing (mock)
                product.barcode,
                product.name,
                product.price,
                product.stock,
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

        // 1. Reduce Stock
        const res = await client.query(
            `UPDATE products SET stock = stock - $1 WHERE barcode = $2 RETURNING product_id, name`,
            [qty, barcode]
        );

        if (res.rows.length === 0) {
            throw new Error('Product not found');
        }

        const product = res.rows[0];

        // 2. Log Defective (Lazy create table if not exists for this demo)
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
