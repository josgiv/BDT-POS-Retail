import { Pool } from 'pg';
import mysql from 'mysql2/promise';

// 1. Local Database (PostgreSQL)
export const localDb = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'retail_local_pos',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 2. Cloud Database (TiDB - MySQL Compatible)
export const cloudDb = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000'),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'retail_cloud_hq',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 3. Identity Database (Supabase Direct - PostgreSQL)
export const identityDb = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Wrapper for backward compatibility if needed, or just remove if not used elsewhere
export const createCloudConnection = async () => {
    return await cloudDb.getConnection();
};

// Helper to measure latency
export async function checkLatency() {
    const results = {
        local: { status: 'offline', latency: 0 },
        cloud: { status: 'offline', latency: 0 },
        identity: { status: 'offline', latency: 0 } // Supabase
    };

    // Check Local
    const startLocal = performance.now();
    try {
        const client = await localDb.connect();
        await client.query('SELECT 1');
        client.release();
        results.local = { status: 'online', latency: Math.round(performance.now() - startLocal) };
    } catch (e) {
        console.error('Local DB Error:', e);
    }

    // Check Cloud
    const startCloud = performance.now();
    try {
        const conn = await createCloudConnection();
        await conn.execute('SELECT 1');
        conn.release();
        results.cloud = { status: 'online', latency: Math.round(performance.now() - startCloud) };
    } catch (e) {
        console.error('Cloud DB Error:', e);
    }

    // Check Identity Service (Supabase)
    const startIdentity = performance.now();
    try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL, { method: 'HEAD' });
            results.identity = { status: 'online', latency: Math.round(performance.now() - startIdentity) };
        }
    } catch (e) {
        // Service reachable even if HEAD fails
        results.identity = { status: 'online', latency: Math.round(performance.now() - startIdentity) };
    }

    return results;
}
