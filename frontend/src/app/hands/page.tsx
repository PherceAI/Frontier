// Hands Portal - Mobile Optimized Luminous Design
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, ArrowRight, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';

export default function HandsPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('sessionToken');
        if (token) {
            const employeeData = localStorage.getItem('employee');
            if (employeeData) {
                try {
                    const employee = JSON.parse(employeeData);
                    const areas = employee.areas || [];
                    const areaNames = areas.map((a: any) => (a.name || '').toLowerCase());

                    if (areaNames.some((n: string) => n.includes('lavander'))) router.push('/hands/lavanderia');
                    else if (areaNames.some((n: string) => n.includes('camarer'))) router.push('/hands/camareros');
                    else if (areaNames.some((n: string) => n.includes('limp'))) router.push('/hands/limpieza');
                    else if (areaNames.some((n: string) => n.includes('cocina'))) router.push('/hands/cocina');
                } catch (e) {
                    // Invalid data, better to stay here and re-login
                }
            }
        }
    }, [router]);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!employeeId.trim()) {
            toast.error("Ingrese su ID de empleado");
            return;
        }

        setIsLoading(true);

        try {
            // Import dynamically to avoid SSR issues if any (though client comp is fine)
            const { opsService } = await import('@/services/operations');
            const data = await opsService.login(employeeId);

            // Save Session
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('employee', JSON.stringify(data.employee));

            toast.success(`Bienvenido, ${data.employee.fullName.split(' ')[0]}`);

            // Redirect based on Area Name
            const areas = data.employee.areas || [];
            const areaNames = areas.map((a: any) => (a.name || '').toLowerCase());

            if (areaNames.some((n: string) => n.includes('lavander'))) {
                router.push('/hands/lavanderia');
            } else if (areaNames.some((n: string) => n.includes('camarer'))) {
                router.push('/hands/camareros');
            } else if (areaNames.some((n: string) => n.includes('limp'))) {
                router.push('/hands/limpieza');
            } else if (areaNames.some((n: string) => n.includes('cocina'))) {
                router.push('/hands/cocina');
            } else {
                toast.error("No se encontró área asignada al empleado.");
            }

        } catch (error: any) {
            toast.error(error.message || "Error de autenticación");
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            setEmployeeId('');
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNumberClick = (num: string) => {
        if (employeeId.length < 4) {
            if (navigator.vibrate) navigator.vibrate(10);
            setEmployeeId(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        setEmployeeId(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        setEmployeeId('');
    };

    return (
        <main className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4 relative overflow-hidden font-[family-name:var(--font-outfit)]">

            {/* Background Blob for Mobile freshness */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] bg-blue-100/60 rounded-full blur-[80px] opacity-60" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-emerald-100/60 rounded-full blur-[80px] opacity-60" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-sm"
            >
                <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-3xl p-6 md:p-8">

                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">Portal Operativo</h1>
                        <p className="text-slate-500 text-sm">Registro de asistencia y actividad</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">ID de Colaborador</label>
                            <motion.div
                                className="relative group"
                                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                <UserCheck className={`absolute left-4 top-4 w-6 h-6 transition-colors duration-300 ${employeeId ? 'text-blue-500' : 'text-slate-300'}`} />
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    value={employeeId}
                                    readOnly
                                    placeholder="••••••"
                                    className="pl-12 bg-slate-50 border-slate-200 text-slate-900 text-3xl font-mono tracking-[0.5em] h-16 rounded-2xl text-center focus:ring-0 focus:border-blue-500 transition-all cursor-default select-none shadow-inner"
                                />
                            </motion.div>
                        </div>

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-3 mb-2 select-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="h-14 w-full bg-slate-50 hover:bg-white active:bg-blue-50 rounded-xl border border-slate-100 shadow-sm active:shadow-inner active:scale-95 transition-all duration-100 flex items-center justify-center"
                                >
                                    <span className="text-2xl font-semibold text-slate-700">{num}</span>
                                </button>
                            ))}

                            {/* Clear Button */}
                            <button
                                type="button"
                                onClick={handleClear}
                                className="h-14 w-full bg-slate-50 hover:bg-red-50 active:bg-red-100 rounded-xl border border-slate-100 shadow-sm active:shadow-inner active:scale-95 transition-all duration-100 flex items-center justify-center group"
                            >
                                <X className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors" />
                            </button>

                            {/* Zero */}
                            <button
                                type="button"
                                onClick={() => handleNumberClick('0')}
                                className="h-14 w-full bg-slate-50 hover:bg-white active:bg-blue-50 rounded-xl border border-slate-100 shadow-sm active:shadow-inner active:scale-95 transition-all duration-100 flex items-center justify-center"
                            >
                                <span className="text-2xl font-semibold text-slate-700">0</span>
                            </button>

                            {/* Backspace */}
                            <button
                                type="button"
                                onClick={handleBackspace}
                                className="h-14 w-full bg-slate-50 hover:bg-white active:bg-blue-50 rounded-xl border border-slate-100 shadow-sm active:shadow-inner active:scale-95 transition-all duration-100 flex items-center justify-center group text-slate-400 hover:text-slate-600"
                            >
                                <span className="text-lg font-bold">⌫</span>
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-lg font-semibold shadow-xl shadow-blue-600/25 transition-all duration-200 mt-2"
                            disabled={isLoading || employeeId.length === 0}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verificando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Iniciar Turno <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            ¿Problemas para acceder? <a href="#" className="text-blue-600 font-medium">Contactar Supervisor</a>
                        </p>
                    </div>

                </div>
            </motion.div>
        </main>
    );
}
