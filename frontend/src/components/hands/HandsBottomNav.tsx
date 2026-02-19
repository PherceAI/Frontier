'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HandsBottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const [areaPath, setAreaPath] = useState<string>('/hands/dashboard'); // Default fallback

    useEffect(() => {
        // Determine area path once
        const empStr = localStorage.getItem('employee');
        if (empStr) {
            try {
                const emp = JSON.parse(empStr);
                const areas = emp.areas || [];
                const isLaundry = areas.some((a: any) => a.type === 'PROCESSOR');
                const isHousekeeping = areas.some((a: any) => a.type === 'SOURCE');

                if (isLaundry) setAreaPath('/hands/laundry');
                else if (isHousekeeping) setAreaPath('/hands/housekeeping');
            } catch (e) {
                console.error("Error parsing employee data for nav", e);
            }
        }
    }, []);

    const isTasks = pathname.includes('/hands/tasks');

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[5.5rem] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 flex items-center justify-around z-50 pb-safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            {/* Area Button */}
            <button
                onClick={() => router.push(areaPath)}
                className={`group flex flex-col items-center gap-1.5 transition-all duration-300 w-20 ${!isTasks ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 relative ${!isTasks ? 'bg-blue-50 dark:bg-blue-500/10 -translate-y-1 shadow-sm' : 'bg-transparent'}`}>
                    <Home className="w-6 h-6" strokeWidth={!isTasks ? 2.5 : 2} />
                    {!isTasks && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Área</span>
            </button>

            {/* Separator / Spacer for visual breath */}
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />

            {/* Tasks Button */}
            <button
                onClick={() => router.push('/hands/tasks')}
                className={`group flex flex-col items-center gap-1.5 transition-all duration-300 w-20 ${isTasks ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 relative ${isTasks ? 'bg-blue-50 dark:bg-blue-500/10 -translate-y-1 shadow-sm' : 'bg-transparent'}`}>
                    <ClipboardList className="w-6 h-6" strokeWidth={isTasks ? 2.5 : 2} />
                    {isTasks && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">Tareas</span>
            </button>
        </div>
    )
}
