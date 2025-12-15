'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionDetailModal } from "@/components/features/TransactionDetailModal";
import { getTransactionDetailsAction } from "@/app/pos/actions"; // We might need a global version of this

interface AdminTransactionsClientProps {
    initialTransactions: any[];
}

export default function AdminTransactionsClient({ initialTransactions }: AdminTransactionsClientProps) {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [details, setDetails] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = async (trx: any) => {
        setSelectedTransaction(trx);
        setIsModalOpen(true);
        setDetails([]); // Reset details while loading

        try {
            // Fetch details from server action
            const items = await getTransactionDetailsAction(trx.transaction_uuid, trx.branch_id);
            setDetails(items);
        } catch (error) {
            console.error("Failed to fetch transaction details:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Transactions</h2>
                    <p className="text-neutral-500">View real-time transactions from all branches (TiDB).</p>
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
                                <TableHead>Branch</TableHead>
                                <TableHead>Cashier</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((trx: any) => (
                                <TableRow key={trx.transaction_uuid} className="cursor-pointer hover:bg-neutral-50" onClick={() => handleViewDetails(trx)}>
                                    <TableCell className="font-mono text-xs text-neutral-500">
                                        {trx.transaction_uuid.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {new Date(trx.created_at).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{trx.branch_name || trx.branch_id}</Badge>
                                    </TableCell>
                                    <TableCell>{trx.cashier_name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{trx.payment_method}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        Rp {parseInt(trx.grand_total).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Cloud</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(trx); }}>
                                            <Eye className="h-4 w-4 text-neutral-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <TransactionDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTransaction}
                items={details}
            />
        </div>
    );
}
