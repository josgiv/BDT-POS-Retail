'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Activity,
    Server,
    Database,
    Cloud,
    Cpu,
    HardDrive,
    AlertTriangle,
    RefreshCw,
    Users,
    Shield,
    Lock,
    Network,
    Zap,
    Layers,
    Clock,
    CheckCircle,
    Monitor
} from 'lucide-react';
import { getSystemHealth } from './actions';
import { getSystemResources } from '../actions';
import { motion } from 'framer-motion';

interface ServerResources {
    cpu: { usage: number; cores: number; model: string };
    memory: { total: number; used: number; free: number; usagePercent: number };
    uptime: string;
    platform: string;
    hostname: string;
    loadAvg: number[];
}

export default function SystemHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [serverRes, setServerRes] = useState<ServerResources | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, resources] = await Promise.all([
                getSystemHealth(),
                getSystemResources()
            ]);
            setHealth(data);
            setServerRes(resources);
        } catch (error) {
            console.error('Failed to fetch health:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(1)} GB`;
    };

    if (loading && !health) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin text-orange-600" />
                <p className="text-lg font-medium text-neutral-600">Connecting to Alfamart Infrastructure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-neutral-50/50 min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-900">System Infrastructure Health</h2>
                    <p className="text-neutral-500">Real-time monitoring of Alfamart distributed nodes</p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Diagnostics
                </Button>
            </div>

            {/* Server Resources (Dashboard Server) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="border-none shadow-md overflow-hidden ring-1 ring-neutral-200">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Monitor className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Dashboard Server</CardTitle>
                                    <CardDescription>Host: {serverRes?.hostname || 'localhost'} • {serverRes?.platform || 'Unknown'}</CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 px-4 py-1">
                                RUNNING
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU Usage</span>
                                    <span>{serverRes?.cpu?.usage || 0}%</span>
                                </div>
                                <Progress value={serverRes?.cpu?.usage || 0} className="h-2" />
                                <p className="text-xs text-neutral-400">{serverRes?.cpu?.cores || 0} cores • {serverRes?.cpu?.model?.split('@')[0] || 'Unknown CPU'}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> RAM Usage</span>
                                    <span>{serverRes?.memory?.usagePercent || 0}%</span>
                                </div>
                                <Progress value={serverRes?.memory?.usagePercent || 0} className="h-2" />
                                <p className="text-xs text-neutral-400">{formatBytes(serverRes?.memory?.used || 0)} / {formatBytes(serverRes?.memory?.total || 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Server Uptime</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">{serverRes?.uptime || 'N/A'}</p>
                                <p className="text-xs text-neutral-400">Load Avg: {serverRes?.loadAvg?.map(l => l.toFixed(2)).join(' • ') || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* TiDB Cloud Node */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
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
                                    <p className="text-xs text-neutral-400 font-mono">REGION: AP-SOUTHEAST-1</p>
                                    <p className="text-xs text-neutral-400 font-mono">UPTIME: {health?.tidb?.uptime || 'N/A'}</p>
                                </div>
                                <Badge variant={health?.tidb?.status === 'healthy' ? 'default' : 'destructive'} className="bg-blue-600 hover:bg-blue-700 px-4 py-1">
                                    {health?.tidb?.status === 'healthy' ? 'OPERATIONAL' : 'OFFLINE'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Compute Load (vCPU)</span>
                                    <span>{health?.tidb?.metrics?.cpu_usage || 0}%</span>
                                </div>
                                <Progress value={health?.tidb?.metrics?.cpu_usage || 0} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Memory Usage (RAM)</span>
                                    <span>{health?.tidb?.metrics?.ram_usage || 0}%</span>
                                </div>
                                <Progress value={health?.tidb?.metrics?.ram_usage || 0} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium text-neutral-600">
                                    <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage Usage</span>
                                    <span>{health?.tidb?.metrics?.storage_size || 0} GB</span>
                                </div>
                                <Progress value={45} className="h-2" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <MetricCard icon={<Activity className="h-4 w-4" />} label="QPS" value={health?.tidb?.qps || 0} subtext="Queries/sec" />
                            <MetricCard icon={<Network className="h-4 w-4" />} label="Active Threads" value={health?.tidb?.connections || 0} />
                            <MetricCard icon={<Layers className="h-4 w-4" />} label="Hot Regions" value={health?.tidb?.metrics?.hot_regions || 0} />
                            <MetricCard icon={<Server className="h-4 w-4" />} label="Nodes Online" value={health?.tidb?.metrics?.nodes_online || 0} />
                            <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Slow Queries" value={health?.tidb?.metrics?.slow_queries || 0} alert={(health?.tidb?.metrics?.slow_queries || 0) > 0} />
                            <MetricCard icon={<Lock className="h-4 w-4" />} label="Deadlocks" value={health?.tidb?.metrics?.deadlocks || 0} alert={(health?.tidb?.metrics?.deadlocks || 0) > 0} />
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
                            <Badge variant={health?.supabase?.status === 'healthy' ? 'default' : 'destructive'} className="bg-purple-600 hover:bg-purple-700 px-4 py-1">
                                {health?.supabase?.status === 'healthy' ? 'SECURE' : 'UNREACHABLE'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricCard icon={<Users className="h-4 w-4" />} label="Total Users" value={health?.supabase?.active_users || 0} />
                            <MetricCard icon={<Network className="h-4 w-4" />} label="Active Sessions" value={health?.supabase?.active_sessions || 0} />
                            <MetricCard icon={<Activity className="h-4 w-4" />} label="API Latency" value={`${health?.supabase?.latency || 0}ms`} />
                            <MetricCard icon={<Lock className="h-4 w-4" />} label="MFA Enabled" value={health?.supabase?.mfa_enabled || 0} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Sync Queue Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
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
                                <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{health?.sync?.pending || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <span className="font-medium text-red-900">Failed Uploads</span>
                                </div>
                                <Badge variant="destructive" className="text-lg px-3 py-1">{health?.sync?.failed || 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-900">Synced (24h)</span>
                                </div>
                                <Badge variant="outline" className="bg-white text-green-700 border-green-200 text-lg px-3 py-1">{health?.sync?.completed || 0}</Badge>
                            </div>
                        </div>
                        {health?.sync?.last_sync && (
                            <div className="mt-4 text-center text-sm text-neutral-500">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Last sync: {new Date(health.sync.last_sync).toLocaleString('id-ID')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function MetricCard({ icon, label, value, subtext, alert }: { icon: React.ReactNode, label: string, value: string | number, subtext?: string, alert?: boolean }) {
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
