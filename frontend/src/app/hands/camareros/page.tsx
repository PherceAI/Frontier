'use client';

import { useState, useEffect } from 'react';
import { Play, Sparkles, BedDouble, Plus, Minus, ArrowRight, Loader2, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// from definitions in types/operations
interface CatalogItem {
    id: string;
    name: string;
    category: string;
}

interface WelcomeData {
    fullName: string;
    employeeCode: string;
}

interface HousekeepingStatus {
    totalCollected: number;
    totalActive: number;
    history: any[];
}

export default function CamarerasView() {
    const [employee, setEmployee] = useState<WelcomeData | null>(null);
    const [status, setStatus] = useState<HousekeepingStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [catalog, setCatalog] = useState<CatalogItem[]>([]);

    // { [item_id]: quantity }
    const [cycleItems, setCycleItems] = useState<Record<string, number>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Get Employee Data
            const empStr = localStorage.getItem('employee');
            if (empStr) {
                const emp = JSON.parse(empStr);
                setEmployee({
                    fullName: emp.fullName || emp.full_name || 'Personal',
                    employeeCode: emp.employeeCode || emp.employee_code || ''
                });
            }

            // Fetch Status and Catalog in parallel
            const [statusRes, catalogRes] = await Promise.all([
                api.operations.housekeeping.status(),
                api.operations.catalog.housekeeping() // We will use generic catalog for now, or just fetch directly.
            ]);

            setStatus(statusRes as any);

            // Fetch catalog items via session-authenticated endpoint (NOT admin-only config)
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const itemsRes = await fetch('/api/operations/catalog/items', {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
                    },
                });
                const itemsRequest = await itemsRes.json();
                if (itemsRequest?.success && itemsRequest?.data) {
                    const allowedNames = [
                        'sábanas grandes', 'sábanas medianas', 'sábanas pequeñas',
                        'toallas grandes', 'toallas medianas', 'toallas pequeñas'
                    ];
                    let mappedItems = itemsRequest.data.filter((i: any) =>
                        allowedNames.includes(i.name.toLowerCase().trim())
                    );

                    mappedItems.sort((a: any, b: any) => {
                        return allowedNames.indexOf(a.name.toLowerCase().trim()) - allowedNames.indexOf(b.name.toLowerCase().trim());
                    });

                    setCatalog(mappedItems.length > 0 ? mappedItems : fallbackCatalog);
                } else {
                    setCatalog(fallbackCatalog);
                }
            } catch (e) {
                setCatalog(fallbackCatalog);
            }

        } catch (error) {
            console.error("Error loading camareras data", error);
            // Ignore error for now, use fallback
            setCatalog(fallbackCatalog);
        } finally {
            setIsLoading(false);
        }
    };

    const fallbackCatalog: CatalogItem[] = [
        { id: 'item-1', name: 'Sábanas Grandes', category: 'LENCERIA' },
        { id: 'item-2', name: 'Sábanas Medianas', category: 'LENCERIA' },
        { id: 'item-3', name: 'Sábanas Pequeñas', category: 'LENCERIA' },
        { id: 'item-4', name: 'Toallas Grandes', category: 'LENCERIA' },
        { id: 'item-5', name: 'Toallas Medianas', category: 'LENCERIA' },
        { id: 'item-6', name: 'Toallas Pequeñas', category: 'LENCERIA' },
    ];

    const updateQuantity = (id: string, delta: number) => {
        setCycleItems(prev => {
            const current = prev[id] || 0;
            const newQty = Math.max(0, current + delta);
            if (newQty === 0) {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            }
            return { ...prev, [id]: newQty };
        });
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const handleRegisterDelivery = async () => {
        const itemIds = Object.keys(cycleItems);
        if (itemIds.length === 0) {
            toast.error("Debes agregar al menos una prenda para registrar la bajada.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payloadItems = Object.entries(cycleItems).map(([item_id, quantity]) => ({
                item_id,
                quantity
            }));

            // Calc dispatch number roughly based on history length today
            const deliveryNumber = `Envío Lencería #${(status?.history?.length || 0) + 1}`;

            await api.operations.housekeeping.log({
                items: payloadItems,
                notes: deliveryNumber
            } as any);

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">¡Envío Registrado!</span>
                    <span>Tus prendas ya fueron contabilizadas en lavandería.</span>
                </div>
            );

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Reset
            setCycleItems({});
            loadData(); // refresh status

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al registrar el envío de blancos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalSelected = Object.values(cycleItems).reduce((a, b) => a + b, 0);
    const deliveriesToday = status?.history?.length || 0;
    const itemsDeliveredToday = status?.totalCollected || 0;

    return (
        <div className="pb-24 pt-4 px-4 max-w-lg mx-auto">

            {/* Top Bar Welcome */}
            <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-lg">
                        {employee?.fullName.charAt(0) || 'C'}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Limpieza & Protocolo</p>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Hola, {employee?.fullName.split(' ')[0] || 'Camarera'}</h1>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/20 relative overflow-hidden">
                    <BedDouble className="absolute -right-2 -bottom-2 w-16 h-16 opacity-20" />
                    <p className="text-pink-100 text-xs font-semibold uppercase tracking-wider mb-1">Envíos Hoy</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{deliveriesToday}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Ropa Enviada</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{itemsDeliveredToday}</span>
                        <span className="text-slate-400 text-xs font-medium">prendas</span>
                    </div>
                </div>
            </div>

            {/* Main Action - Delivery Builder */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registro</h2>
                    <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                        {totalSelected} prendas
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-sm font-medium">Cargando catálogo...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-white/5">
                            {catalog.map(item => {
                                const qty = cycleItems[item.id] || 0;
                                return (
                                    <div key={item.id} className={`p-4 transition-colors ${qty > 0 ? 'bg-pink-50/50 dark:bg-pink-900/10' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${qty > 0 ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400' : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-slate-400'}`}>
                                                    <ArrowDownCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">A LA LAVANDERÍA</p>
                                                </div>
                                            </div>

                                            {/* Stepper controls */}
                                            <div className="flex items-center bg-slate-100 dark:bg-gray-700 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all active:scale-95 ${qty > 0 ? 'bg-white shadow-sm text-slate-700 dark:bg-gray-600 dark:text-white' : 'text-slate-400 opacity-50'}`}
                                                    disabled={qty === 0}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <div className="w-10 text-center font-bold text-slate-900 dark:text-white tabular-nums">
                                                    {qty}
                                                </div>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-700 dark:bg-gray-600 dark:text-white active:scale-95 transition-all"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Start Cycle Button Footer (Sticky within view) */}
            <AnimatePresence>
                {totalSelected > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-4 right-4 z-40"
                    >
                        <Button
                            onClick={handleRegisterDelivery}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-xl shadow-pink-600/20 rounded-2xl flex items-center justify-between px-6 text-lg font-bold border-0"
                        >
                            <span className="flex items-center gap-3">
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                                Bajar Prendas
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                    {totalSelected} prend.
                                </span>
                            </div>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
