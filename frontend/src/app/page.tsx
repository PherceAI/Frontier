'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck, Users } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => setTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-800 font-[family-name:var(--font-outfit)] relative overflow-hidden selection:bg-blue-100">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-slate-900">Frontier</span>
        </div>

        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium font-mono text-slate-600">{time}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 md:px-0">

        <div className="text-center mb-16 max-w-2xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Excelencia Operativa.
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
              Plataforma centralizada para la gestión inteligente de recursos y operaciones hoteleras.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4 md:px-0">

          {/* Card: Administración */}
          <Link href="/tower" className="group w-full">
            <motion.div
              whileHover={{ y: -4 }}
              className="h-full bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/90 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <ShieldCheck className="w-32 h-32" />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Portal Administrativo</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 pr-8">
                  Panel de control gerencial. Métricas financieras, gestión de inventarios y configuración global del sistema.
                </p>

                <div className="mt-auto flex items-center text-slate-900 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Acceder al Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Card: Operaciones */}
          <Link href="/hands" className="group w-full">
            <motion.div
              whileHover={{ y: -4 }}
              className="h-full bg-slate-900/5 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Users className="w-32 h-32" />
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">Portal Operativo</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8 pr-8">
                  Acceso para colaboradores. Registro de asistencia, seguimiento de tareas y reportes de actividad.
                </p>

                <div className="mt-auto flex items-center text-blue-700 font-medium text-sm group-hover:translate-x-1 transition-transform">
                  Iniciar Sesión <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </motion.div>
          </Link>

        </div>
      </main>

      <footer className="relative z-10 py-8 text-center">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          FRONTIER OPERATING SYSTEM &bull; v2.0
        </p>
      </footer>
    </div>
  );
}
