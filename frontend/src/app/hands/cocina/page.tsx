'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ClipboardCheck, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CocinaView() {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState('');

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'x-session-token': localStorage.getItem('sessionToken') || '',
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/operations/cocina', { headers: getHeaders() });
            const json = await res.json();
            if (json.success) setHistory(json.data);
        } catch {
            toast.error('Error al cargar historial');
        }
    };

    const handleSubmit = async () => {
        if (!notes.trim()) {
            toast.error('Agrega una nota del pedido o preparación');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/operations/cocina', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ notes, items: [] }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Registro guardado');
                setNotes('');
                fetchHistory();
            }
        } catch {
            toast.error('Error al registrar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('employee');
        window.location.href = '/hands';
    };

    return (
        <main className="min-h-screen bg-[#F0F2F5] p-4 font-[family-name:var(--font-outfit)]">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Cocina</h1>
                            <p className="text-xs text-slate-500">Alimentos y Bebidas</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Salir
                    </Button>
                </motion.div>

                {/* Form */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-amber-600" /> Nuevo Registro
                    </h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Preparación desayuno buffet, pedido room service hab. 301..."
                        className="w-full h-24 rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                    />
                    <Button onClick={handleSubmit} disabled={isLoading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-12 font-semibold shadow-lg shadow-amber-600/20">
                        {isLoading ? 'Guardando...' : 'Registrar Operación'}
                    </Button>
                </motion.div>

                {/* History */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Historial de Hoy
                    </h2>
                    {history.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Sin registros hoy</p>
                    ) : (
                        <div className="space-y-2">
                            {history.map((h: any) => (
                                <div key={h.id} className="p-3 bg-slate-50 rounded-xl text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-slate-700">{h.notes || 'Registro'}</span>
                                        <span className="text-xs text-slate-400">{new Date(h.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
