import { localDb } from '../lib/db';

async function migrate() {
    const client = await localDb.connect();
    try {
        console.log("Connected to Local DB:", process.env.POSTGRES_DB);

        // 1. Create Table
        console.log("Creating inventory_local table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS inventory_local (
                inventory_id SERIAL PRIMARY KEY,
                branch_id INT NOT NULL,
                product_id BIGINT NOT NULL,
                qty_on_hand INT NOT NULL DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products_local(product_id)
            );
        `);

        // 2. Seed Data (if empty)
        const countRes = await client.query("SELECT COUNT(*) FROM inventory_local");
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log("Seeding inventory_local...");
            // Insert inventory for all existing products
            // Random quantity between 5 and 50 (so some are < 10)
            await client.query(`
                INSERT INTO inventory_local (branch_id, product_id, qty_on_hand)
                SELECT 
                    101, 
                    product_id, 
                    floor(random() * 45 + 5)::int 
                FROM products_local;
            `);
            console.log("Seeded inventory for all products.");
        } else {
            console.log("Inventory table already has data.");
        }

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
