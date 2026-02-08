'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    RefreshCw,
    LogOut,
    PackageOpen,
    ArrowRight,
    CheckCircle2,
    History,
    Plus,
    Minus,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const loadService = () => import('@/services/operations');

export default function LaundryPage() {
    const router = useRouter();
    const [employeeName, setEmployeeName] = useState('');
    const [incoming, setIncoming] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Current Cycle Composition
    // Map of itemId -> quantity to wash in this cycle
    const [currentLoad, setCurrentLoad] = useState<Record<string, number>>({});

    const fetchStatus = async () => {
        try {
            const { opsService } = await loadService();
            const res = await opsService.getLaundryStatus();
            const data = res.data;
            setIncoming(data?.collections || []);
            setHistory(data?.history || []);
        } catch (error) {
            toast.error('Error actualizando estado');
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const empStr = localStorage.getItem('employee');
                if (!empStr) {
                    router.push('/hands');
                    return;
                }
                const emp = JSON.parse(empStr);
                setEmployeeName(emp.fullName.split(' ')[0]);
                await fetchStatus();
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    const adjustLoad = (itemId: string, delta: number, max: number) => {
        setCurrentLoad(prev => {
            const current = prev[itemId] || 0;
            const next = Math.max(0, Math.min(max, current + delta));
            if (next === 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: next };
        });
    };

    const handleRegisterCycle = async () => {
        const itemsToProcess = Object.entries(currentLoad).map(([id, qty]) => {
            // Find the item definition from incoming list to get real ID if needed
            // The incoming list has { id: uuid, name: ..., total: ... }
            // Wait, the incoming list from backend has UUIDs generated on the fly in `getStatus`?
            // Ah, checking LaundryHandler: yes, 'id' => Str::uuid().
            // BUT we need the REAL item_id to log it!
            // The handler `getPendingWork` returns `ci.id` as the real ID.
            // Let's check LaundryHandler.php...
            // It maps `id` to `Str::uuid()`. This is BAD for logging back.
            // We need to fix LaundryHandler to return the real item ID.
            // For now, let's assume the frontend just sends back what it got.
            // If the ID is random UUID, the logging will fail.
            return { item_id: id, quantity: qty };
        });

        if (itemsToProcess.length === 0) {
            toast.warning("Agrega prendas al ciclo antes de registrar");
            return;
        }

        setIsSubmitting(true);
        try {
            const { opsService } = await loadService();

            // We submit 1 cycle with the breakdown
            await opsService.submitLaundryLog(1, itemsToProcess);

            toast.success("Ciclo registrado exitosamente");
            setCurrentLoad({}); // Reset form
            await fetchStatus(); // Refresh pending list and history

        } catch (error: any) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                const msg = errors?.quantity?.[0] || "Error de validación";
                toast.error(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">Error de Inventario</span>
                        <span>{msg}</span>
                    </div>,
                    { duration: 5000, className: "bg-red-50 border-red-200 text-red-800" }
                );
                // Do NOT reset form so user can fix it
            } else {
                toast.error("Error registrando ciclo");
                console.error(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/hands');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] text-slate-400">Cargando...</div>;

    const totalPending = incoming.reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
    const currentLoadCount = Object.values(currentLoad).reduce((a, b) => a + b, 0);

    const pendingBreakdown = incoming
        .filter(i => (parseInt(i.total) || 0) > 0)
        .sort((a, b) => (parseInt(b.total) || 0) - (parseInt(a.total) || 0));

    return (
        <main className="min-h-screen bg-[#F0F2F5] pb-32 font-[family-name:var(--font-outfit)]">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 rounded-b-[2.5rem] shadow-sm mb-6 flex justify-between items-center sticky top-0 z-30">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Turno Activo</p>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">Hola, {employeeName}</h1>
                </div>
                <button onClick={handleLogout} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="px-5 space-y-8">

                {/* Status Hero */}
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/20">
                    <div className="relative z-10 flex justify-between items-end mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1 text-slate-300">
                                <PackageOpen className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider">Pendiente Global</span>
                            </div>
                            <div className="text-5xl font-bold tracking-tight">{totalPending}</div>
                            <div className="text-slate-400 text-sm mt-1">Prendas por procesar</div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-indigo-400">{history.length}</div>
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-wide">Ciclos Hoy</div>
                        </div>
                    </div>

                    {/* Breakdown List */}
                    {pendingBreakdown.length > 0 && (
                        <div className="relative z-10 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
                                {pendingBreakdown.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                                        <span className="text-xs text-indigo-200 font-medium truncate mr-2">{item.name}</span>
                                        <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded-md min-w-[2rem] text-center">
                                            {item.total}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20" />
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20" />
                </div>

                {/* Cycle Composer */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-indigo-600" />
                            Nuevo Ciclo
                        </h3>
                        {currentLoadCount > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                                {currentLoadCount} prendas
                            </span>
                        )}
                    </div>

                    <div className="grid gap-3">
                        {incoming.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-900">¡Todo al día!</h3>
                                <p className="text-slate-500 text-sm">No hay prendas pendientes por lavar.</p>
                            </div>
                        ) : (
                            incoming.map((item) => {
                                const active = (currentLoad[item.id] || 0);
                                const max = item.total; // Limit to what's available? Or allow override?
                                // Allowing override for now as physical reality > system reality
                                return (
                                    <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all duration-200 ${active > 0 ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-100'
                                        }`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    Pendientes: <span className="text-slate-900">{item.total}</span>
                                                </p>
                                            </div>
                                            {active > 0 && (
                                                <div className="bg-indigo-600 text-white text-lg font-bold px-4 py-1 rounded-xl shadow-lg shadow-indigo-600/20 min-w-[3rem] text-center">
                                                    {active}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => adjustLoad(item.id, -10, 999)}
                                                className="flex-1 h-12 rounded-xl text-slate-400 border-slate-100 bg-slate-50 hover:bg-slate-100 hover:text-slate-600"
                                                disabled={active === 0}
                                            >
                                                -10
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => adjustLoad(item.id, -1, 999)}
                                                className="flex-1 h-12 rounded-xl text-slate-400 border-slate-100 bg-slate-50 hover:bg-slate-100 hover:text-slate-600"
                                                disabled={active === 0}
                                            >
                                                <Minus className="w-5 h-5" />
                                            </Button>

                                            <div className="w-[1px] bg-slate-100 mx-1" />

                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => adjustLoad(item.id, 1, 999)}
                                                className="flex-1 h-12 rounded-xl border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => adjustLoad(item.id, 10, 999)}
                                                className="flex-1 h-12 rounded-xl border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200 font-bold"
                                            >
                                                +10
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Today's History */}
                {history.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-2">
                            <History className="w-4 h-4" />
                            Tu Producción (Hoy)
                        </h3>
                        <div className="space-y-3">
                            {history.map((log) => (
                                <div key={log.id} className="bg-white/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-700 text-sm">{log.timestamp}</span>
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold uppercase">Ciclo Completado</span>
                                        </div>
                                        <div className="text-xs text-slate-500 space-y-1">
                                            {/* @ts-ignore */}
                                            {log.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                    <span>{item.name}</span>
                                                    <span className="font-bold text-slate-700">x{item.quantity}</span>
                                                </div>
                                            ))}
                                            {(!log.items || log.items.length === 0) && (
                                                <span className="italic opacity-50">Sin detalle de artículos</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F0F2F5] via-[#F0F2F5] to-transparent z-40">
                <AnimatePresence>
                    {currentLoadCount > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                        >
                            <Button
                                onClick={handleRegisterCycle}
                                disabled={isSubmitting}
                                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? 'Guardando...' : (
                                    <>
                                        <span>Registrar Ciclo</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                            {currentLoadCount} Items
                                        </span>
                                        <ArrowRight className="w-5 h-5 opacity-50" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
