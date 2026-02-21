// Tower Sidebar - Clean White
// Fully redesigned to match user request: White background, no shadows, clean typography.
// FIXED: Removed collapsible behavior and rail to ensure sidebar is always visible.
'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import {
    LayoutDashboard,
    Activity,
    Users,
    Map,
    Package,
    Settings,
    LogOut,
    ChevronUp,
    ShieldCheck,
    Bell,
    HelpCircle,
    Building2,
    ClipboardList
} from 'lucide-react';

const menuItems = [
    { title: 'Dashboard', href: '/tower', icon: LayoutDashboard },
    { title: 'Tareas', href: '/tower/tasks', icon: ClipboardList },
    { title: 'Habitaciones', href: '/tower/rooms', icon: Building2 },
    { title: 'Empleados', href: '/tower/employees', icon: Users },
    { title: 'Áreas', href: '/tower/areas', icon: Map },
];

export function TowerSidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/tower/login';
    };

    return (
        <Sidebar className="border-r border-slate-100 bg-white">
            <SidebarHeader className="p-6 pb-2">
                <Link href="/tower" className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-lg">
                        Frontier
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 py-6">
                <SidebarGroup>
                    <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Menu
                    </div>
                    <SidebarMenu className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={isActive}
                                        className={`h-10 rounded-lg px-3 transition-colors duration-200 ${isActive
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <Link href={item.href} className="flex items-center gap-3">
                                            <item.icon className={`h-4.5 w-4.5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <span className="text-sm">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="mt-6">
                    <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Sistema
                    </div>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="h-10 rounded-lg px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200">
                                <Link href="/tower/config" className="flex items-center gap-3 w-full">
                                    <Settings className="h-4.5 w-4.5 text-slate-400" />
                                    <span className="text-sm">Configuración</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="h-10 rounded-lg px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200">
                                <Link href="#" className="flex items-center gap-3 w-full">
                                    <HelpCircle className="h-4.5 w-4.5 text-slate-400" />
                                    <span className="text-sm">Ayuda</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-slate-50">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button suppressHydrationWarning className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <Avatar className="h-8 w-8 rounded-full border border-slate-200">
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">AD</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                                <span className="text-sm font-semibold text-slate-900 truncate">Administrator</span>
                                <span className="text-xs text-slate-500 truncate">Admin Manager</span>
                            </div>
                            <ChevronUp className="h-4 w-4 text-slate-400 ml-auto" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        align="start"
                        className="w-56 rounded-lg bg-white border-slate-100 text-slate-700 shadow-xl shadow-slate-200/50 p-1"
                    >
                        <DropdownMenuLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                            Mi Cuenta
                        </DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-md focus:bg-blue-50 focus:text-blue-700 cursor-pointer px-2 py-2 text-sm font-medium">
                            <Bell className="mr-2 h-4 w-4" /> Notificaciones
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100 my-1" />
                        <DropdownMenuItem onClick={handleLogout} className="rounded-md text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer px-2 py-2 text-sm font-medium">
                            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
