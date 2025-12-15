import { getAllEmployees } from '../actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const employees = await getAllEmployees();

    const roleColors: Record<string, string> = {
        'SUPER_ADMIN': 'bg-purple-100 text-purple-700',
        'AREA_MANAGER': 'bg-blue-100 text-blue-700',
        'STORE_LEADER': 'bg-orange-100 text-orange-700',
        'CASHIER': 'bg-emerald-100 text-emerald-700',
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Manajemen Karyawan</h2>
                    <p className="text-slate-500">Daftar semua karyawan dari TiDB Cloud</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Karyawan
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{employees.length}</p>
                                <p className="text-sm opacity-80">Total Karyawan</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {['SUPER_ADMIN', 'AREA_MANAGER', 'CASHIER'].map(role => (
                    <Card key={role}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${roleColors[role]}`}>
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{employees.filter((e: any) => e.role === role).length}</p>
                                    <p className="text-sm text-slate-500">{role.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Karyawan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Nama Lengkap</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Branch ID</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((emp: any) => (
                                <TableRow key={emp.user_id}>
                                    <TableCell>{emp.user_id}</TableCell>
                                    <TableCell className="font-mono">{emp.username}</TableCell>
                                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                                    <TableCell>{emp.email || '-'}</TableCell>
                                    <TableCell>
                                        <Badge className={roleColors[emp.role] || 'bg-slate-100 text-slate-700'}>
                                            {emp.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{emp.branch_id || 'ALL'}</TableCell>
                                    <TableCell className="text-center">
                                        {emp.is_active ? (
                                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {employees.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                        Tidak ada data karyawan
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
