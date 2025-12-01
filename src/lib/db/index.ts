import 'server-only';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';

// 1. Local PostgreSQL Connection
export const localDb = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'retail_local_pos',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// 2. Cloud TiDB Connection (MySQL Protocol)
export const cloudDb = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || '4000'),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper to check connections
export async function checkConnections() {
    const status = {
        local: false,
        cloud: false,
    };

    try {
        const client = await localDb.connect();
        await client.query('SELECT 1');
        client.release();
        status.local = true;
    } catch (e) {
        console.error('Local DB Error:', e);
    }

    try {
        const [rows] = await cloudDb.query('SELECT 1');
        status.cloud = true;
    } catch (e) {
        console.error('Cloud DB Error:', e);
    }

    return status;
}
