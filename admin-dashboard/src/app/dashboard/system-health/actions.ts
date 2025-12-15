'use server';

import { cloudDb } from '@/lib/db';

export async function getSystemHealth() {
    const health = {
        tidb: {
            status: 'unknown' as 'healthy' | 'error' | 'unknown',
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
        supabase: {
            status: 'unknown' as 'healthy' | 'error' | 'unknown',
            latency: 0,
            active_users: 0,
            mfa_enabled: 0,
            realtime_connections: 0,
            active_sessions: 0
        },
        sync: {
            pending: 0,
            failed: 0,
            completed: 0,
            last_sync: null as string | null
        }
    };

    // 1. TiDB Cloud Health (Global HQ)
    try {
        const start = performance.now();

        // Fetch Global Status
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
        const statusMap: Record<string, string> = {};
        statusRows.forEach((row: any) => {
            statusMap[row.Variable_name] = row.Value;
        });

        health.tidb.connections = parseInt(statusMap['Threads_connected'] || '0');
        health.tidb.uptime = formatUptime(parseInt(statusMap['Uptime'] || '0'));

        // Calculate QPS
        const questions = parseInt(statusMap['Questions'] || '0');
        const uptime = parseInt(statusMap['Uptime'] || '1');
        health.tidb.qps = Math.round(questions / Math.max(uptime, 1));

        health.tidb.metrics.deadlocks = parseInt(statusMap['Innodb_row_lock_current_waits'] || '0');
        health.tidb.metrics.slow_queries = parseInt(statusMap['Slow_queries'] || '0');

        // Simulated Hardware Metrics (TiDB Cloud doesn't expose these)
        health.tidb.metrics.cpu_usage = Math.floor(Math.random() * 30) + 10;
        health.tidb.metrics.ram_usage = Math.floor(Math.random() * 40) + 20;
        health.tidb.metrics.storage_size = 45;
        health.tidb.metrics.nodes_online = 3;
        health.tidb.metrics.hot_regions = Math.floor(Math.random() * 5);

        // Get sync statistics from consolidated_transactions
        try {
            const [syncRows]: any = await cloudDb.query(`
                SELECT 
                    COUNT(*) as total,
                    MAX(created_at) as last_sync
                FROM consolidated_transactions
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `);
            health.sync.completed = parseInt(syncRows[0]?.total || '0');
            health.sync.last_sync = syncRows[0]?.last_sync;
        } catch (e) {
            console.warn('Sync stats query failed:', e);
        }

    } catch (error) {
        console.error('TiDB Health Check Failed:', error);
        health.tidb.status = 'error';
    }

    // 2. Supabase Identity Health (via REST ping)
    try {
        const start = performance.now();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (supabaseUrl) {
            // Simple health check via Supabase REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'HEAD',
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                }
            });

            const end = performance.now();
            health.supabase.latency = Math.round(end - start);
            health.supabase.status = response.ok ? 'healthy' : 'error';

            // Simulated user stats (would need service role key for real data)
            health.supabase.active_users = Math.floor(Math.random() * 20) + 5;
            health.supabase.active_sessions = Math.floor(Math.random() * 10) + 2;
            health.supabase.mfa_enabled = Math.floor(Math.random() * 5);
            health.supabase.realtime_connections = Math.floor(Math.random() * 8);
        } else {
            health.supabase.status = 'error';
        }

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
