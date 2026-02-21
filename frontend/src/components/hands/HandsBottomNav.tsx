'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, History, ClipboardList, LogOut } from 'lucide-react';
import Link from 'next/link';

interface HandsBottomNavProps {
    basePath?: string;
}

export default function HandsBottomNav({ basePath: providedBasePath }: HandsBottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('employee');
            router.push('/hands');
        }
    };

    // If no basePath is provided, try to extract it from the current pathname
    // e.g. /hands/camareros/tasks -> basePath = /hands/camareros
    const basePath = providedBasePath || (pathname.split('/').slice(0, 3).join('/'));

    const navItems = [
        {
            label: 'Inicio',
            icon: Home,
            href: basePath,
            activeParams: [basePath], // exact match mostly when split
        },
        {
            label: 'Historial',
            icon: History,
            href: `${basePath}/history`,
            activeParams: ['/history'],
        },
        {
            label: 'Tareas',
            icon: ClipboardList,
            href: `${basePath}/tasks`,
            activeParams: ['/tasks'],
        }
    ];

    const isActive = (itemHref: string, itemParams: string[]) => {
        if (itemHref === basePath && pathname === basePath) return true;
        return itemParams.some(param => pathname.includes(param) && param !== basePath);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[5.5rem] bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-white/5 flex items-center justify-around z-50 pb-safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">

            {navItems.map((item) => {
                const active = isActive(item.href, item.activeParams);
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        prefetch={true}
                        className={`group flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                    >
                        <div className={`p-2 rounded-2xl transition-all duration-300 relative ${active ? 'bg-blue-50 dark:bg-blue-500/10 -translate-y-1' : 'bg-transparent'}`}>
                            <item.icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                            {active && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-wider opacity-90">{item.label}</span>
                    </Link>
                );
            })}

            {/* Separator */}
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="group flex flex-col items-center gap-1 transition-all duration-300 w-16 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
            >
                <div className="p-2 rounded-2xl transition-all duration-300 bg-transparent group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:-translate-y-1">
                    <LogOut className="w-6 h-6" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold tracking-wider opacity-90">Salir</span>
            </button>

        </div>
    );
}
