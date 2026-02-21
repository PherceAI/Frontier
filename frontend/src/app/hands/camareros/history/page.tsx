'use client';

import { useState, useEffect } from 'react';
import { History, Clock, FileText, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface CycleHistory {
    id: string;
    timestamp: string;
    cycle_number: string;
    items: {
        name: string;
        quantity: number;
    }[];
}

export default function HistoryView() {
    const [history, setHistory] = useState<CycleHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const statusRes = await api.operations.housekeeping.status() as any;
            if (statusRes && statusRes.history) {
                setHistory(statusRes.history);
            }
        } catch (error) {
            console.error("Error loading history", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <History className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Historial de Hoy</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Envíos de lencería de tu turno</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl h-24 animate-pulse" />
                    ))}
                </div>
            ) : history.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-white/5 mt-8">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Aún no hay registros</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Tus recolecciones aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((cycle) => (
                        <div key={cycle.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5">

                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{cycle.cycle_number || 'Envío Registrado'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-700 px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                    <Clock className="w-3.5 h-3.5" />
                                    {cycle.timestamp}
                                </div>
                            </div>

                            <ul className="space-y-2">
                                {cycle.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            {item.name}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                            {item.quantity} u.
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total prendas</span>
                                <span className="text-sm font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                    {cycle.items.reduce((acc, curr) => acc + curr.quantity, 0)}
                                </span>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
