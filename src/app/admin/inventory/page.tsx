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
import { Search, Filter, RefreshCw, Plus } from "lucide-react";

async function getInventory() {
    const client = await localDb.connect();
    try {
        const res = await client.query(`
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.category,
        p.price,
        i.qty_on_hand,
        i.shelf_loc,
        i.last_updated
      FROM products_local p
      LEFT JOIN inventory_local i ON p.product_id = i.product_id
      ORDER BY p.name ASC
    `);
        return res.rows;
    } finally {
        client.release();
    }
}

export default async function InventoryPage() {
    const inventory = await getInventory();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory & Supply</h2>
                    <p className="text-neutral-500">Monitor stock levels and supply chain.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync from Cloud
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Stock Request
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Current Stock</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
                                <Input placeholder="Search product..." className="pl-8" />
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
                                <TableHead>Barcode</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map((item) => (
                                <TableRow key={item.product_id}>
                                    <TableCell className="font-mono text-xs text-neutral-500">
                                        {item.barcode}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.category}</Badge>
                                    </TableCell>
                                    <TableCell>{item.shelf_loc || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        Rp {parseInt(item.price).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.qty_on_hand || 0}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {(item.qty_on_hand || 0) < 10 ? (
                                            <Badge variant="destructive">Low Stock</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
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
