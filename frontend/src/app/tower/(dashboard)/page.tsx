// Tower Dashboard - Clean White Aesthetic
'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, configApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2, Package, Users, TrendingUp, Calendar, MoreHorizontal, ArrowUpRight, ArrowDownRight, BookOpen, Info } from 'lucide-react';

export default function TowerDashboard() {
    const { data: bottleneck, isLoading: bottleneckLoading } = useQuery({
        queryKey: ['bottleneck'],
        queryFn: dashboardApi.getBottleneck,
        refetchInterval: 30000,
    });

    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['activities'],
        queryFn: () => dashboardApi.getActivities({ limit: '10' }),
        refetchInterval: 30000,
    });

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => configApi.employees.list(),
        refetchInterval: 30000,
    });

    if (bottleneckLoading) {
        return (
            <div className="p-8 space-y-8 min-h-screen bg-[#F8F9FA]">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <Skeleton className="col-span-2 h-96 rounded-2xl" />
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    // Calculations for display
    const pendingRatio = bottleneck?.summary?.pendingRatio || 0;
    const efficiencyColor = pendingRatio < 0.2 ? 'text-blue-500' : pendingRatio < 0.5 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-[family-name:var(--font-outfit)] text-slate-900 pb-20">

            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Visión general de operaciones</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors shadow-blue-200">
                        Exportar Reporte
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {/* Metric 1: Demanda */}
                <Card className="border-none shadow-sm shadow-slate-200/60 rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            {bottleneck?.summary?.trends && (
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${bottleneck.summary.trends.demand >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                    {bottleneck.summary.trends.demand >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {bottleneck.summary.trends.demand}%
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Demanda Total</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{bottleneck?.summary.totalDemand || 0}</h3>
                    </CardContent>
                </Card>

                {/* Metric 2: Suministro */}
                <Card className="border-none shadow-sm shadow-slate-200/60 rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Package className="w-6 h-6" />
                            </div>
                            {bottleneck?.summary?.trends && (
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${bottleneck.summary.trends.supply >= 0 ? 'text-indigo-600 bg-indigo-50' : 'text-red-600 bg-red-50'}`}>
                                    {bottleneck.summary.trends.supply >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {bottleneck.summary.trends.supply}%
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Suministro</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{bottleneck?.summary.totalSupply || 0}</h3>
                    </CardContent>
                </Card>

                {/* Metric 3: Pendientes */}
                <Card className="border-none shadow-sm shadow-slate-200/60 rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            {bottleneck?.summary?.trends && (
                                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${bottleneck.summary.trends.pending <= 0 ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                    {bottleneck.summary.trends.pending > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {Math.abs(bottleneck.summary.trends.pending)}%
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Pendientes</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{Math.round((bottleneck?.summary.pendingRatio || 0) * 100)}%</h3>
                    </CardContent>
                </Card>

                {/* Metric 4: Personal */}
                <Card className="border-none shadow-sm shadow-slate-200/60 rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                                Active
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Personal</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{employees?.pagination?.total || 0}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Column: Workload/Status */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-sm shadow-slate-200/60 rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">Estado Operativo</CardTitle>
                                <p className="text-slate-500 text-sm">Rendimiento por área</p>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-8 pt-2">
                            {/* CSS Bar Chart Simulation */}
                            <div className="space-y-6 mt-4">
                                {bottleneck?.byArea?.map((area: any) => {
                                    // Calculate relative percentages for visual bars
                                    const total = area.demand + area.supply + area.pending + 1; // avoid div by zero
                                    const demandPct = (area.demand / total) * 100;
                                    const supplyPct = (area.supply / total) * 100;

                                    return (
                                        <div key={area.areaId} className="group">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-bold text-slate-700">{area.areaName}</span>
                                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                                    <span className="text-blue-600">{area.supply} procesados</span>
                                                    <span className="text-slate-400">|</span>
                                                    <span className="text-slate-600">{area.demand} total</span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                <div
                                                    style={{ width: `${supplyPct}%` }}
                                                    className="h-full bg-blue-500 rounded-full"
                                                />
                                                <div
                                                    style={{ width: `${demandPct}%` }}
                                                    className="h-full bg-slate-400/20 rounded-r-full ml-1"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                {(!bottleneck?.byArea || bottleneck.byArea.length === 0) && (
                                    <div className="py-12 text-center text-slate-400">No hay datos disponibles</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200/60 rounded-3xl bg-white overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold text-slate-900">Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                {activities?.map((activity: any) => (
                                    <div key={activity.id} className="p-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.eventType === 'DEMAND' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {activity.eventType === 'DEMAND' ? <TrendingUp className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {activity.employee} <span className="font-normal text-slate-500">{activity.eventType === 'DEMAND' ? 'solicitó' : 'procesó'} items</span>
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                    {activity.area} &bull; {new Date(activity.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600 ml-4 whitespace-nowrap">
                                            {activity.totalItems} items
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summaries/Charts */}
                <div className="space-y-8">
                    {/* Guía de Operación */}
                    <Card className="border-none shadow-sm shadow-blue-100 rounded-3xl bg-blue-50/50 overflow-hidden border-2 border-dashed border-blue-200">
                        <CardHeader className="p-6 pb-2">
                            <div className="flex items-center gap-2 text-blue-700">
                                <BookOpen className="w-5 h-5" />
                                <CardTitle className="text-lg font-bold">Guía de Operación</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                    <p className="text-xs text-slate-600">Representa tu hotel en <b>Puntos de Origen</b> (donde se solicita trabajo) y <b>Puntos de Operación</b> (donde se realiza).</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                    <p className="text-xs text-slate-600">Los empleados usan el portal <b>Hands</b> con su PIN para registrar lo que envían o reciben.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                    <p className="text-xs text-slate-600">Este Dashboard muestra la brecha entre lo pedido y lo entregado en tiempo real.</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 bg-blue-100/50 w-fit px-2 py-1 rounded-md">
                                    <Info className="w-3 h-3" /> Tip: Recepción es un punto de origen.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200/60 rounded-3xl bg-white overflow-hidden min-h-[350px]">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold text-slate-900">Eficiencia Global</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 flex flex-col items-center justify-center">
                            {/* CSS Donut Chart */}
                            <div className="relative w-48 h-48 rounded-full bg-slate-50 flex items-center justify-center mb-8"
                                style={{
                                    background: `conic-gradient(#2563EB 0% ${100 - (pendingRatio * 100)}%, #F59E0B ${100 - (pendingRatio * 100)}% 100%)`
                                }}
                            >
                                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center z-10 shadow-sm">
                                    <span className="text-4xl font-bold text-slate-900">{Math.round((1 - pendingRatio) * 100)}%</span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Efectividad</span>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-slate-600 font-medium">Procesado</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{bottleneck?.summary.totalSupply}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <span className="text-slate-600 font-medium">Pendiente</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{(bottleneck?.summary.totalDemand || 0) - (bottleneck?.summary.totalSupply || 0)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 text-white rounded-3xl overflow-hidden shadow-lg shadow-blue-200">
                        <CardContent className="p-8 relative">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2">Modo Pro</h3>
                                <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                                    Accede a analíticas avanzadas y reportes detallados para optimizar tu operación.
                                </p>
                                <button className="bg-white text-blue-700 w-full py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                                    Ver Detalles
                                </button>
                            </div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
