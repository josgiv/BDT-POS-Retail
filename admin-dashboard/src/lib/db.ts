import mysql from 'mysql2/promise';

// Cloud Database (TiDB - MySQL Compatible) - Primary for Admin
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

// Helper to measure cloud latency
export async function checkCloudLatency(): Promise<{ status: string; latency: number }> {
    const start = performance.now();
    try {
        const conn = await createCloudConnection();
        await conn.execute('SELECT 1');
        conn.release();
        return { status: 'online', latency: Math.round(performance.now() - start) };
    } catch (e) {
        console.error('Cloud DB Error:', e);
        return { status: 'offline', latency: 0 };
    }
}
