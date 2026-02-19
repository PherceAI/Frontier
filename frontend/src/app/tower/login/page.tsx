// Tower Login Page - Luminous Enterprise
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function TowerLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await authApi.adminLogin(email, password);

            // Store tokens
            Cookies.set('accessToken', data.accessToken, { expires: 1 });
            Cookies.set('refreshToken', data.refreshToken, { expires: 7 });

            toast.success(`Bienvenido, ${data.user.fullName}`);
            router.push('/tower');
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || 'Credenciales inválidas';
            toast.error(msg);
            if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6 relative overflow-hidden font-[family-name:var(--font-outfit)]">

            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-100/60 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/60 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-[420px]"
            >
                <div className="bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden p-10 relative">

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/10">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Portal Administrativo</h1>
                        <p className="text-slate-500 mt-2 text-sm">Acceso seguro para gerencia</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@frontier.cloud"
                                    required
                                    className="pl-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-slate-900 h-12 rounded-xl transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contraseña</label>
                            </div>
                            <div className="relative">
                                <LockKeyhole className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="pl-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-200 text-slate-900 h-12 rounded-xl transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all duration-300 shadow-lg shadow-slate-900/20 mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Autenticando...
                                </div>
                            ) : 'Acceder al Sistema'}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Fronter Operating System &bull; Secured with SSL
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Hint - Remove in Prod */}
                <div className="mt-8 text-center bg-white/40 backdrop-blur-sm py-3 px-4 rounded-xl border border-white/40 inline-block w-full">
                    <div className="text-xs text-slate-500 font-mono">
                        <span className="font-bold text-slate-700">DEMO:</span>
                        {" admin@hotel.com / Admin123!"}
                    </div>
                </div>

            </motion.div>
        </main>
    );
}
