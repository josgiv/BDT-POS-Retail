import { localDb, createCloudConnection } from '@/lib/db';
export const dynamic = 'force-dynamic';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Server } from "lucide-react";

async function getBranches() {
    // 1. Get Local Config
    const client = await localDb.connect();
    let localConfig = null;
    try {
        const res = await client.query('SELECT * FROM store_config LIMIT 1');
        localConfig = res.rows[0];
    } finally {
        client.release();
    }

    // 2. Get All Branches from Cloud (if available)
    let allBranches = [];
    try {
        const cloudConn = await createCloudConnection();
        const [rows] = await cloudConn.execute('SELECT * FROM branches');
        allBranches = rows as any[];
        await cloudConn.release();
    } catch (e) {
        console.error("Failed to fetch from cloud:", e);
        // Fallback if cloud is offline, just show local
        if (localConfig) {
            allBranches = [{
                branch_id: localConfig.branch_id,
                branch_code: localConfig.branch_code,
                branch_name: localConfig.store_name,
                address: localConfig.store_address,
                region_name: 'LOCAL',
                is_active: 1
            }];
        }
    }

    return { localConfig, allBranches };
}

export default async function BranchesPage() {
    const { localConfig, allBranches } = await getBranches();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Branch Management</h2>
                    <p className="text-neutral-500">Overview of all store branches and network status.</p>
                </div>
            </div>

            {/* Local Store Config */}
            {localConfig && (
                <Card className="bg-neutral-900 text-white border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="text-yellow-500" />
                            Current Store Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-neutral-400 text-sm">Branch Code</div>
                                <div className="text-xl font-bold text-yellow-500">{localConfig.branch_code}</div>
                            </div>
                            <div>
                                <div className="text-neutral-400 text-sm">Store Name</div>
                                <div className="text-lg font-semibold">{localConfig.store_name}</div>
                            </div>
                            <div>
                                <div className="text-neutral-400 text-sm">Address</div>
                                <div className="text-sm">{localConfig.store_address}</div>
                            </div>
                            <div>
                                <div className="text-neutral-400 text-sm">Last Sync</div>
                                <div className="text-sm font-mono">{localConfig.last_sync_ts ? new Date(localConfig.last_sync_ts).toLocaleString() : 'Never'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Branches (Cloud Data)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allBranches.map((branch) => (
                                <TableRow key={branch.branch_id}>
                                    <TableCell>{branch.branch_id}</TableCell>
                                    <TableCell className="font-mono">{branch.branch_code}</TableCell>
                                    <TableCell className="font-medium">
                                        {branch.branch_name}
                                        {localConfig?.branch_id === branch.branch_id && (
                                            <Badge className="ml-2 bg-yellow-500 text-black hover:bg-yellow-400">This Store</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{branch.region_name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{branch.address}</TableCell>
                                    <TableCell className="text-center">
                                        {branch.is_active ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
