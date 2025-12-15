import { Pool } from 'pg';
import mysql from 'mysql2/promise';

// 1. Local Database (PostgreSQL) - Primary for Cashier
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

// 2. Cloud Database (TiDB - MySQL Compatible) - Sync Target
export const cloudDb = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000'),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE || 'retail_cloud_hq',
    ssl: process.env.TIDB_HOST ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to get cloud connection
export const createCloudConnection = async () => {
    return await cloudDb.getConnection();
};

// Helper to measure latency
export async function checkLatency() {
    const results: {
        local: { status: 'online' | 'offline'; latency: number };
        cloud: { status: 'online' | 'offline'; latency: number };
    } = {
        local: { status: 'offline', latency: 0 },
        cloud: { status: 'offline', latency: 0 },
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

    return results;
}

// Helper to determine schema based on branch ID
export function getSchemaForBranch(branchId: string | number): string {
    const id = String(branchId);
    switch (id) {
        case '101': return 'retail_jakarta';
        case '102': return 'retail_bandung';
        case '103': return 'retail_surabaya';
        default: return 'retail_jakarta';
    }
}
