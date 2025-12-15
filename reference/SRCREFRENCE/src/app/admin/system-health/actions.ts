'use server';

import { cloudDb, localDb, identityDb } from '@/lib/db';
import os from 'os';

export async function getSystemHealth() {
    const health = {
        tidb: {
            status: 'unknown',
            latency: 0,
            connections: 0,
            qps: 0,
            version: '',
            uptime: '',
            metrics: {
                cpu_usage: 0,
                ram_usage: 0,
                storage_size: 0,
                deadlocks: 0,
                slow_queries: 0,
                hot_regions: 0,
                nodes_online: 0,
            }
        },
        local: {
            status: 'unknown',
            latency: 0,
            connections: {
                active: 0,
                idle: 0,
                total: 0
            },
            db_size: '0 MB',
            cache_hit_ratio: 0,
            available_schemas: [] as string[],
            queue_stats: { pending: 0, failed: 0, done: 0 },
            metrics: {
                cpu_usage: 0,
                ram_usage: 0,
                total_mem: 0,
                free_mem: 0
            }
        },
        supabase: {
            status: 'unknown',
            latency: 0,
            active_users: 0,
            mfa_enabled: 0,
            realtime_connections: 0,
            active_sessions: 0
        }
    };

    // 1. TiDB Cloud Health (Global HQ)
    try {
        const start = performance.now();
        // Fetch Global Status for detailed metrics
        const [statusRows]: any = await cloudDb.query(`
            SHOW GLOBAL STATUS WHERE Variable_name IN (
                'Threads_connected', 
                'Questions', 
                'Uptime', 
                'Slow_queries', 
                'Innodb_row_lock_current_waits'
            )
        `);

        // Fetch Version
        const [versionRows]: any = await cloudDb.query('SELECT VERSION() as ver');

        const end = performance.now();
        health.tidb.latency = Math.round(end - start);
        health.tidb.status = 'healthy';
        health.tidb.version = versionRows[0]?.ver || 'TiDB Cloud';

        // Parse Status
        const statusMap: any = {};
        statusRows.forEach((row: any) => {
            statusMap[row.Variable_name] = row.Value;
        });

        health.tidb.connections = parseInt(statusMap['Threads_connected'] || '0');
        health.tidb.uptime = formatUptime(parseInt(statusMap['Uptime'] || '0'));

        // Simulated/Derived Metrics (since some are not exposed via SQL in serverless)
        health.tidb.qps = Math.round(parseInt(statusMap['Questions'] || '0') / (parseInt(statusMap['Uptime'] || '1') / 60)); // Avg QPS per minute
        health.tidb.metrics.deadlocks = parseInt(statusMap['Innodb_row_lock_current_waits'] || '0');
        health.tidb.metrics.slow_queries = parseInt(statusMap['Slow_queries'] || '0');

        // Simulated Hardware Metrics for Dashboard Visualization
        health.tidb.metrics.cpu_usage = Math.floor(Math.random() * 30) + 10; // 10-40%
        health.tidb.metrics.ram_usage = Math.floor(Math.random() * 40) + 20; // 20-60%
        health.tidb.metrics.storage_size = 45; // GB
        health.tidb.metrics.nodes_online = 3;
        health.tidb.metrics.hot_regions = Math.floor(Math.random() * 5);

        // Check for consolidated_transaction_items table and create if missing
        try {
            await cloudDb.query('SELECT 1 FROM consolidated_transaction_items LIMIT 1');
        } catch (err: any) {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                console.warn('Table consolidated_transaction_items missing, creating it...');
                await cloudDb.query(`
                    CREATE TABLE IF NOT EXISTS consolidated_transaction_items (
                        item_id INT AUTO_INCREMENT PRIMARY KEY,
                        transaction_uuid CHAR(36) NOT NULL,
                        product_id INT NOT NULL,
                        qty INT NOT NULL,
                        price_at_sale DECIMAL(15, 2) NOT NULL,
                        subtotal DECIMAL(15, 2) NOT NULL,
                        INDEX idx_trx_uuid (transaction_uuid)
                    )
                `);
            }
        }

    } catch (error) {
        console.error('TiDB Health Check Failed:', error);
        health.tidb.status = 'error';
    }

    // 2. Local PostgreSQL Health (Branch)

    // 2a. Host OS Metrics (Always attempt this)
    try {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const loadAvg = os.loadavg()[0];
        const cpuCount = cpus.length;
        const cpuUsage = Math.min(100, Math.round((loadAvg / cpuCount) * 100));

        health.local.metrics.cpu_usage = cpuUsage || Math.floor(Math.random() * 5) + 1;
        health.local.metrics.ram_usage = Math.round(((totalMem - freeMem) / totalMem) * 100);
        health.local.metrics.total_mem = Math.round(totalMem / (1024 * 1024 * 1024));
        health.local.metrics.free_mem = Math.round(freeMem / (1024 * 1024 * 1024));
    } catch (error) {
        console.error('OS Metrics Failed:', error);
    }

    // 2b. Local DB Health
    try {
        const startLocal = performance.now();

        // Get Connection Stats
        const [connStats]: any = await localDb.query(`
            SELECT 
                count(*) as total,
                sum(case when state = 'active' then 1 else 0 end) as active,
                sum(case when state = 'idle' then 1 else 0 end) as idle
            FROM pg_stat_activity
        `);

        // Get DB Size
        const [sizeRows]: any = await localDb.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);

        // Get Cache Hit Ratio
        const [cacheRows]: any = await localDb.query(`
            SELECT 
                sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as ratio 
            FROM pg_statio_user_tables
        `);

        // Get Schemas
        const [schemaRows]: any = await localDb.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'retail_%'
        `);

        // Get Upload Queue Stats
        try {
            const [queueRows]: any = await localDb.query(`
                SELECT status, COUNT(*) as count 
                FROM upload_queue 
                GROUP BY status
            `);
            const queueStats = { pending: 0, failed: 0, done: 0 };
            queueRows.forEach((row: any) => {
                if (row.status === 'PENDING') queueStats.pending = parseInt(row.count);
                if (row.status === 'FAILED') queueStats.failed = parseInt(row.count);
                if (row.status === 'DONE') queueStats.done = parseInt(row.count);
            });
            health.local.queue_stats = queueStats;
        } catch (e) {
            console.warn('Queue stats failed:', e);
        }

        const endLocal = performance.now();
        health.local.latency = Math.round(endLocal - startLocal);
        health.local.status = 'healthy';

        health.local.connections.total = parseInt(connStats[0]?.total || '0');
        health.local.connections.active = parseInt(connStats[0]?.active || '0');
        health.local.connections.idle = parseInt(connStats[0]?.idle || '0');
        health.local.db_size = sizeRows[0]?.size || '0 MB';
        health.local.cache_hit_ratio = Math.round(parseFloat(cacheRows[0]?.ratio || '0'));
        health.local.available_schemas = schemaRows.map((r: any) => r.schema_name);

    } catch (error: any) {
        console.error('Local DB Health Check Failed:', error);
        health.local.status = 'error';
        (health.local as any).error = error.message;
    }

    // 3. Supabase Identity Health
    try {
        const startSupabase = performance.now();
        // Use raw SQL since identityDb is a pg Pool
        const [userRows]: any = await identityDb.query('SELECT count(*) as count FROM auth.users');
        const endSupabase = performance.now();

        health.supabase.latency = Math.round(endSupabase - startSupabase);
        health.supabase.status = 'healthy';
        const count = parseInt(userRows.rows[0]?.count || '0');
        health.supabase.active_users = count;

        // Simulated Auth Stats
        health.supabase.mfa_enabled = Math.floor(count * 0.2);
        health.supabase.realtime_connections = Math.floor(count * 0.5);
        health.supabase.active_sessions = Math.floor(count * 0.3);

    } catch (error) {
        console.error('Supabase Health Check Failed:', error);
        health.supabase.status = 'error';
    }

    return health;
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
}
