import { localDb, checkLatency } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Database, Cloud, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

async function getSystemStatus() {
    const latency = await checkLatency();

    const client = await localDb.connect();
    let queueStats = { pending: 0, failed: 0, done: 0 };
    let dbSize = 'Unknown';

    try {
        // Queue Stats
        const queueRes = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM upload_queue 
      GROUP BY status
    `);

        queueRes.rows.forEach(row => {
            if (row.status === 'PENDING') queueStats.pending = parseInt(row.count);
            if (row.status === 'FAILED') queueStats.failed = parseInt(row.count);
            if (row.status === 'DONE') queueStats.done = parseInt(row.count);
        });

        // DB Size (Approx)
        const sizeRes = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
        dbSize = sizeRes.rows[0].size;

    } finally {
        client.release();
    }

    return { latency, queueStats, dbSize };
}

export default async function HealthPage() {
    const { latency, queueStats, dbSize } = await getSystemStatus();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                    <p className="text-neutral-500">Monitor infrastructure, sync status, and database performance.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Latency Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Local DB Latency</CardTitle>
                        <Database className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latency.local.latency}ms</div>
                        <Progress value={100} className="mt-2 h-2" indicatorClassName="bg-green-500" />
                        <p className="text-xs text-neutral-500 mt-2">Status: {latency.local.status}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cloud Sync Latency</CardTitle>
                        <Cloud className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{latency.cloud.latency}ms</div>
                        <Progress value={latency.cloud.status === 'online' ? 100 : 0} className="mt-2 h-2" indicatorClassName="bg-blue-500" />
                        <p className="text-xs text-neutral-500 mt-2">Status: {latency.cloud.status}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                        <Activity className="h-4 w-4 text-neutral-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dbSize}</div>
                        <p className="text-xs text-neutral-500 mt-2">Local Storage Usage</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sync Queue Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Sync Queue Status</CardTitle>
                    <CardDescription>Real-time status of data synchronization to Cloud HQ.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                                <span className="font-medium">Pending Uploads</span>
                            </div>
                            <Badge variant="secondary">{queueStats.pending}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Failed Uploads</span>
                            </div>
                            <Badge variant="destructive">{queueStats.failed}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Successfully Synced</span>
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{queueStats.done}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
