import { localDb } from '../lib/db';

async function migrate() {
    const client = await localDb.connect();
    try {
        console.log("Connected to Local DB:", process.env.POSTGRES_DB);

        // 1. Add Column
        console.log("Adding shelf_loc column...");
        await client.query(`
            ALTER TABLE inventory_local 
            ADD COLUMN IF NOT EXISTS shelf_loc VARCHAR(20);
        `);

        // 2. Seed Data
        console.log("Seeding shelf_loc data...");
        // Update with random shelf locations like A-01, B-05, etc.
        await client.query(`
            UPDATE inventory_local
            SET shelf_loc = 
                chr(floor(random() * 5 + 65)::int) || '-' || 
                lpad(floor(random() * 10 + 1)::text, 2, '0')
            WHERE shelf_loc IS NULL;
        `);

        console.log("Migration complete.");

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
