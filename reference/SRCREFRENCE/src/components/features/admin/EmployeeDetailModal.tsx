'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, User, MapPin, Shield, Calendar } from "lucide-react";

interface EmployeeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
}

export function EmployeeDetailModal({ isOpen, onClose, employee }: EmployeeDetailModalProps) {
    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Employee Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-4">
                    <Avatar className="h-24 w-24 border-4 border-neutral-100">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.username}`} />
                        <AvatarFallback className="text-2xl">{employee.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-neutral-900">{employee.full_name}</h3>
                        <p className="text-sm text-neutral-500">@{employee.username}</p>
                    </div>
                    <Badge variant="outline" className="px-4 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200">
                        {employee.role}
                    </Badge>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-center">
                        <Mail className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">{employee.email || 'No email provided'}</span>
                    </div>
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-center">
                        <User className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">ID: {employee.user_id}</span>
                    </div>
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-center">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">Branch: {employee.branch_id || 'Headquarters'}</span>
                    </div>
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-center">
                        <Shield className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">Status: {employee.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="grid grid-cols-[24px_1fr] gap-3 items-center">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">Joined: {new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
