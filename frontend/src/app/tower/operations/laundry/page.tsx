"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, WashingMachine, TrendingDown, TrendingUp } from "lucide-react";

interface BottleneckData {
    summary: {
        totalDemand: number;
        totalSupply: number;
        pendingRatio: number;
        status: 'OK' | 'WARNING' | 'CRITICAL';
        trends: {
            demand: number;
            supply: number;
            pending: number;
        };
    };
    byArea: Array<{
        areaId: string;
        areaName: string;
        type: string;
        demand: number;
        supply: number;
        pending: number;
        status: string;
    }>;
    alerts: Array<{
        area: string;
        level: string;
        message: string;
    }>;
}

export default function TowerLaundryLogsPage() {
    const { data, isLoading, isError } = useQuery<BottleneckData>({
        queryKey: ["admin-laundry-bottleneck"],
        queryFn: async () => {
            const response = await apiRequest<{ success: boolean; data: BottleneckData }>("/dashboard/bottleneck");
            return response.data;
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !data) {
        return <div className="p-4 text-center text-red-500">Error loading laundry data.</div>;
    }

    const { summary, byArea, alerts } = data;
    const pending = Math.max(0, summary.totalDemand - summary.totalSupply);

    const statusColor = {
        OK: 'bg-emerald-100 text-emerald-800',
        WARNING: 'bg-amber-100 text-amber-800',
        CRITICAL: 'bg-red-100 text-red-800',
    }[summary.status] || 'bg-gray-100 text-gray-800';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Vitácora de Lavandería</h1>
                <p className="text-muted-foreground">
                    Monitorización en tiempo real del inventario sucio y ciclos de lavado.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Recibido</CardDescription>
                        <CardTitle className="text-3xl">{summary.totalDemand}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {summary.trends.demand > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                            <span>{summary.trends.demand}% vs. ayer</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Procesado</CardDescription>
                        <CardTitle className="text-3xl">{summary.totalSupply}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {summary.trends.supply > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                            <span>{summary.trends.supply}% vs. ayer</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pendiente</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                            {pending}
                            <Badge className={statusColor}>{summary.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Ratio pendiente: {(summary.pendingRatio * 100).toFixed(0)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <Card className="border-amber-200">
                    <CardHeader>
                        <CardTitle className="text-lg">⚠️ Alertas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {alerts.map((alert, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <span className="font-medium">{alert.area}</span>
                                <span className="text-sm text-amber-700">{alert.message}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Per-Area Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <WashingMachine className="h-5 w-5" />
                        Desglose por Área
                    </CardTitle>
                    <CardDescription>Demanda vs. Procesamiento por área operativa</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {byArea.map((area) => {
                            const areaStatusColor = {
                                OK: 'border-emerald-200 bg-emerald-50/50',
                                WARNING: 'border-amber-200 bg-amber-50/50',
                                CRITICAL: 'border-red-200 bg-red-50/50',
                            }[area.status] || '';

                            return (
                                <div key={area.areaId} className={`p-4 rounded-lg border ${areaStatusColor}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold">{area.areaName}</span>
                                        <Badge variant="outline" className="text-xs">{area.type}</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs">Recibido</p>
                                            <p className="font-bold">{area.demand}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Procesado</p>
                                            <p className="font-bold">{area.supply}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Pendiente</p>
                                            <p className="font-bold text-amber-600">{area.pending}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
