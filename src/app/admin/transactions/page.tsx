import { localDb } from '@/lib/db';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";

async function getTransactions() {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
      SELECT 
        t.transaction_uuid,
        t.created_at,
        u.full_name as cashier_name,
        t.payment_method,
        t.grand_total,
        t.synced
      FROM transactions t
      LEFT JOIN users_local u ON t.user_id = u.user_id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);
        return res.rows;
    } finally {
        client.release();
    }
}

export default async function TransactionsPage() {
    const transactions = await getTransactions();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                    <p className="text-neutral-500">Manage and view all store transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Transactions</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input placeholder="Search transaction ID..." className="pl-8" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Cashier</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((trx) => (
                                <TableRow key={trx.transaction_uuid}>
                                    <TableCell className="font-mono text-xs text-neutral-500">
                                        {trx.transaction_uuid.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {new Date(trx.created_at).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>{trx.cashier_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{trx.payment_method}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        Rp {parseInt(trx.grand_total).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {trx.synced ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Synced</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Pending</Badge>
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
