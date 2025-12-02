'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Cloud, Cpu, HardDrive, AlertTriangle, RefreshCw, Users, Shield, Lock, Network, Zap, Layers, Clock, Monitor, CheckCircle } from 'lucide-react';
import { getSystemHealth } from './actions';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function SystemHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const data = await getSystemHealth();
        setHealth(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin text-orange-600" />
                <p className="text-lg font-medium text-neutral-600">Connecting to BahlilMart Infrastructure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-neutral-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">System Infrastructure Health</h2>
                    <p className="text-neutral-500">Real-time monitoring of BahlilMart distributed nodes</p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Diagnostics
                </Button>
            </div>

            {/* TiDB Cloud Node */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Cloud className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">TiDB Cloud (Global HQ)</CardTitle>
                                    <CardDescription>Primary Transaction Ledger & Analytics</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-neutral-400 font-mono">REGION: AP-SOUTHEAST-3</p>
                                    <p className="text-xs text-neutral-400 font-mono">UPTIME: {health.tidb.uptime}</p>
                                </div>
                                <Badge variant={health.tidb.status === 'healthy' ? 'default' : 'destructive'} className="bg-blue-600 hover:bg-blue-700 px-4 py-1">
                                    {health.tidb.status === 'healthy' ? 'OPERATIONAL' : 'OFFLINE'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Compute Load (vCPU)</span>
                                    <span>{health.tidb.metrics.cpu_usage}%</span>
                                </div>
                                <Progress value={health.tidb.metrics.cpu_usage} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Memory Usage (RAM)</span>
                                    <span>{health.tidb.metrics.ram_usage}%</span>
                                </div>
                                <Progress value={health.tidb.metrics.ram_usage} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage Usage</span>
                                    <span>{health.tidb.metrics.storage_size} GB</span>
                                </div>
                                <Progress value={45} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <MetricCard icon={<Activity />} label="QPS" value={health.tidb.qps} subtext="Queries/sec" />
                            <MetricCard icon={<Network />} label="Active Threads" value={health.tidb.connections} />
                            <MetricCard icon={<Layers />} label="Hot Regions" value={health.tidb.metrics.hot_regions} />
                            <MetricCard icon={<Server />} label="Nodes Online" value={health.tidb.metrics.nodes_online} />
                            <MetricCard icon={<AlertTriangle />} label="Slow Queries" value={health.tidb.metrics.slow_queries} alert={health.tidb.metrics.slow_queries > 0} />
                            <MetricCard icon={<Lock />} label="Deadlocks" value={health.tidb.metrics.deadlocks} alert={health.tidb.metrics.deadlocks > 0} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Local PostgreSQL Node */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-green-600 to-emerald-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Database className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Local Node (PostgreSQL)</CardTitle>
                                    <CardDescription>Branch Database (Offline-First Capability)</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-neutral-400 font-mono">LATENCY: {health.local.latency}ms</p>
                                </div>
                                <Badge variant={health.local.status === 'healthy' ? 'default' : 'destructive'} className="bg-green-600 hover:bg-green-700 px-4 py-1">
                                    {health.local.status === 'healthy' ? 'ONLINE' : 'ERROR'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        {/* Host Resources */}
                        <div className="mb-6 p-4 bg-neutral-900 rounded-xl text-white">
                            <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Monitor className="h-3 w-3" /> Host Machine Resources (Windows)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-neutral-400">
                                        <span>CPU Load</span>
                                        <span>{health.local.metrics.cpu_usage}%</span>
                                    </div>
                                    <Progress value={health.local.metrics.cpu_usage} className="h-1.5 bg-neutral-800" indicatorClassName="bg-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-neutral-400">
                                        <span>RAM Usage ({health.local.metrics.total_mem} GB Total)</span>
                                        <span>{health.local.metrics.ram_usage}%</span>
                                    </div>
                                    <Progress value={health.local.metrics.ram_usage} className="h-1.5 bg-neutral-800" indicatorClassName="bg-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-neutral-400">Free Memory</span>
                                    <span className="text-xl font-bold font-mono text-green-400">{health.local.metrics.free_mem} GB</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <h4 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Database className="h-3 w-3" /> Storage & Performance
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-400 mb-1">DB Size</p>
                                        <p className="text-2xl font-bold text-neutral-900 tracking-tight">{health.local.db_size}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 mb-1">Cache Hit Ratio</p>
                                        <p className="text-2xl font-bold text-green-600 tracking-tight">{health.local.cache_hit_ratio}%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <h4 className="text-xs font-bold text-neutral-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> Available Schemas
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {health.local.available_schemas?.map((schema: string) => (
                                        <Badge key={schema} variant="outline" className="bg-white text-neutral-600 border-neutral-200 font-mono text-xs">
                                            {schema}
                                        </Badge>
                                    ))}
                                    {(!health.local.available_schemas || health.local.available_schemas.length === 0) && (
                                        <span className="text-sm text-neutral-400 italic">No retail schemas found</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <MetricCard icon={<Activity />} label="Total Conn." value={health.local.connections.total} />
                            <MetricCard icon={<Zap />} label="Active Conn." value={health.local.connections.active} />
                            <MetricCard icon={<Clock />} label="Idle Conn." value={health.local.connections.idle} />
                            <MetricCard icon={<RefreshCw />} label="Latency" value={`${health.local.latency}ms`} />
                            <MetricCard icon={<AlertTriangle />} label="Rollbacks" value={0} alert={false} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Supabase Identity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-purple-600 to-indigo-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Shield className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Identity Service (Supabase)</CardTitle>
                                    <CardDescription>Authentication, Authorization & RLS</CardDescription>
                                </div>
                            </div>
                            <Badge variant={health.supabase.status === 'healthy' ? 'default' : 'destructive'} className="bg-purple-600 hover:bg-purple-700 px-4 py-1">
                                {health.supabase.status === 'healthy' ? 'SECURE' : 'UNREACHABLE'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard icon={<Users />} label="Total Users" value={health.supabase.active_users} />
                            <MetricCard icon={<Network />} label="Active Sessions" value={health.supabase.active_sessions} />
                            <MetricCard icon={<Activity />} label="API Latency" value={`${health.supabase.latency}ms`} />
                            <MetricCard icon={<Lock />} label="MFA Enabled" value={health.supabase.mfa_enabled} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Sync Queue Status (New) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="md:col-span-2 lg:col-span-3">
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <RefreshCw className="h-6 w-6 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Cloud Sync Queue</CardTitle>
                                    <CardDescription>Real-time Data Synchronization Status</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                                    <span className="font-medium text-blue-900">Pending Uploads</span>
                                </div>
                                <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{health.local.queue_stats?.pending || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Failed Uploads</span>
                                </div>
                                <Badge variant="destructive" className="text-lg px-3 py-1">{health.local.queue_stats?.failed || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Successfully Synced</span>
                                </div>
                                <Badge variant="outline" className="bg-white text-green-700 border-green-200 text-lg px-3 py-1">{health.local.queue_stats?.done || 0}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function MetricCard({ icon, label, value, subtext, alert }: { icon: any, label: string, value: string | number, subtext?: string, alert?: boolean }) {
    return (
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-full transition-all hover:shadow-sm ${alert ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-100'}`}>
            <div className="flex items-start justify-between mb-2">
                <div className={`${alert ? 'text-red-500' : 'text-neutral-400'}`}>{icon}</div>
                {alert && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
            </div>
            <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${alert ? 'text-red-600' : 'text-neutral-500'}`}>{label}</p>
                <p className={`text-2xl font-bold tracking-tight ${alert ? 'text-red-700' : 'text-neutral-900'}`}>{value || '0'}</p>
                {subtext && <p className="text-[10px] text-neutral-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
