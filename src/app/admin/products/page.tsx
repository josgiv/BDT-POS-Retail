import { ProductsClient } from './client';
import { localDb } from '@/lib/db';

async function getProducts() {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
      SELECT * FROM products_local ORDER BY name ASC
    `);
        return res.rows;
    } finally {
        client.release();
    }
}

export default async function ProductsPage() {
    const products = await getProducts();
    return <ProductsClient initialProducts={products} />;
}
