'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Package, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function AreaDetailLogs() {
    const params = useParams();
    const areaId = params.id as string;
    const [search, setSearch] = useState('');

    const { data: logs, isLoading } = useQuery({
        queryKey: ['area-logs', areaId, search],
        queryFn: async () => {
            const qs = new URLSearchParams({
                limit: '50',
                ...(search ? { search } : {})
            });
            const res = await apiRequest<any>(`/dashboard/area/${areaId}/logs?${qs}`);
            // API returns paginated response, we need data array
            return res.data || [];
        },
    });

    const { data: area } = useQuery({
        queryKey: ['area', areaId],
        queryFn: async () => {
            // Re-use config api or fetch single area. 
            // Assuming we can get area details via existing list or new endpoint.
            // For now, let's just show ID or generic name until we fix that.
            // Or better, fetch from config/areas/ID if it exists?
            // Let's assume the logs are the main thing.
            return { name: 'Detalle de Área' };
        }
    });

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-20 font-[family-name:var(--font-outfit)] text-slate-900">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/tower/areas" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bitácora de Operaciones</h1>
                        <p className="text-slate-500 text-sm">Historial detallado de actividades</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-none shadow-sm rounded-2xl bg-white">
                    <CardContent className="p-4 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por empleado o código..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {/* Add Date Range Picker here later */}
                    </CardContent>
                </Card>

                {/* Mobile Log View (Timeline Style) */}
                <div className="md:hidden space-y-4">
                    {logs?.data?.map((log: any) => (
                        <Card key={log.id} className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm">
                                            {log.employee.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{log.employee.name}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={
                                        log.type === 'COLLECTION' ? 'bg-amber-50 text-amber-700 border-amber-200 text-[10px]' :
                                            log.type === 'WASH_CYCLE' ? 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]' :
                                                'bg-slate-50 text-slate-700 border-slate-200 text-[10px]'
                                    }>
                                        {log.type === 'COLLECTION' ? 'REC' : 'LAV'}
                                    </Badge>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                                    {log.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs border-b border-slate-100 last:border-0 pb-1 last:pb-0 mb-1 last:mb-0">
                                            <span className="text-slate-600">{item.name}</span>
                                            <span className="font-bold text-slate-900">x{item.quantity}</span>
                                        </div>
                                    ))}
                                    {log.items.length === 0 && <span className="text-xs text-slate-400 italic">Sin items</span>}
                                    <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>{log.total_items}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {logs?.data?.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Sin registros</p>
                        </div>
                    )}
                </div>

                {/* Desktop Logs Table */}
                <Card className="hidden md:block border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Fecha / Hora</th>
                                    <th className="px-6 py-4">Responsable</th>
                                    <th className="px-6 py-4">Acción</th>
                                    <th className="px-6 py-4">Detalles (Items)</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs?.data?.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(log.timestamp).toLocaleString('es-ES')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {log.employee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{log.employee.name}</p>
                                                    <p className="text-xs text-slate-500">{log.employee.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                log.type === 'COLLECTION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    log.type === 'WASH_CYCLE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-slate-50 text-slate-700 border-slate-200'
                                            }>
                                                {log.type === 'COLLECTION' ? 'Recolección' :
                                                    log.type === 'WASH_CYCLE' ? 'Lavado' : log.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {log.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between max-w-[200px] text-xs">
                                                        <span className="text-slate-600">{item.name}</span>
                                                        <span className="font-bold text-slate-900">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                                {log.items.length === 0 && <span className="text-slate-400 italic">Sin desglose</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {log.total_items}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs?.data?.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No se encontraron registros para esta área.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
