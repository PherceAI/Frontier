'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BedDouble, BedSingle, Box, Columns, Footprints, ArrowRight, LogOut, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Dynamic Import for Service
const loadService = () => import('@/services/operations');

export default function HousekeepingPage() {
    const router = useRouter();
    const [employeeName, setEmployeeName] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Check Auth
                const empStr = localStorage.getItem('employee');
                if (!empStr) {
                    router.push('/hands');
                    return;
                }
                const emp = JSON.parse(empStr);
                setEmployeeName(emp.fullName.split(' ')[0]);

                // Load Catalog
                const { opsService } = await loadService();
                const res = await opsService.getCatalog();
                setItems(res.data);

                // Init counts
                const initialCounts: any = {};
                res.data.forEach((item: any) => initialCounts[item.id] = 0);
                setCounts(initialCounts);

            } catch (error) {
                console.error(error);
                toast.error("Error cargando catálogo");
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    const handleIncrement = (id: string) => {
        if (navigator.vibrate) navigator.vibrate(10);
        setCounts(prev => ({ ...prev, [id]: prev[id] + 1 }));
    };

    const handleDecrement = (id: string) => {
        if (navigator.vibrate) navigator.vibrate(10);
        setCounts(prev => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
    };

    const getIcon = (ref: string) => {
        switch (ref) {
            case 'bed-double': return <BedDouble className="w-6 h-6 text-blue-500" />;
            case 'bed-single': return <BedSingle className="w-6 h-6 text-indigo-500" />;
            case 'towel-large': return <Box className="w-6 h-6 text-emerald-500" />; // Fallback icon
            case 'towel-medium': return <Columns className="w-6 h-6 text-teal-500" />;
            case 'footprints': return <Footprints className="w-6 h-6 text-orange-500" />;
            default: return <Box className="w-6 h-6 text-slate-400" />;
        }
    };

    const handleSubmit = async () => {
        // Filter non-zero
        const logs = items.map(item => ({
            item_id: item.id,
            quantity: counts[item.id]
        })).filter(l => l.quantity > 0);

        if (logs.length === 0) {
            toast.warning("No hay items para reportar");
            return;
        }

        setIsSubmitting(true);
        try {
            const { opsService } = await loadService();
            await opsService.submitHousekeepingLog(logs);

            toast.success("Reporte enviado con éxito");
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Reset counts
            const resetCounts: any = {};
            items.forEach((item: any) => resetCounts[item.id] = 0);
            setCounts(resetCounts);

        } catch (error) {
            toast.error("Error enviando reporte");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/hands');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] text-slate-400">Cargando...</div>;

    return (
        <main className="min-h-screen bg-[#F0F2F5] pb-24 font-[family-name:var(--font-outfit)]">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 rounded-b-[2rem] shadow-sm mb-6 flex justify-between items-center sticky top-0 z-20">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Camareras</p>
                    <h1 className="text-2xl font-bold text-slate-900">Hola, {employeeName}</h1>
                </div>
                <button onClick={handleLogout} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 space-y-4">
                <p className="text-sm text-slate-500 ml-2 mb-2">Registro de Salida (Sucio)</p>

                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                                {getIcon(item.icon_ref)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                <p className="text-xs text-slate-400 font-medium">{item.unit || 'pcs'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                            <button
                                onClick={() => handleDecrement(item.id)}
                                className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform text-xl font-bold"
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-bold text-lg text-slate-800">{counts[item.id]}</span>
                            <button
                                onClick={() => handleIncrement(item.id)}
                                className="w-10 h-10 bg-blue-600 rounded-lg shadow-md shadow-blue-500/20 flex items-center justify-center text-white active:scale-90 transition-transform text-xl font-bold"
                            >
                                +
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F0F2F5] via-[#F0F2F5] to-transparent z-20">
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                >
                    {isSubmitting ? 'Enviando...' : (
                        <span className="flex items-center gap-2">
                            Enviar Reporte <CheckCircle className="w-5 h-5" />
                        </span>
                    )}
                </Button>
            </div>
        </main>
    );
}
