'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TowerSidebar } from "@/components/tower/sidebar";

export default function ProtectedTowerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = Cookies.get('accessToken');
        if (!token) {
            router.replace('/tower/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Or a loading spinner preventing the "flash"
    }

    return (
        <SidebarProvider>
            <TowerSidebar />
            <SidebarInset className="bg-[#f8fafc]">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-white border-b border-slate-100 md:hidden">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                </header>
                <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-10 max-w-[1600px] w-full mx-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
