'use client';

import { User, Users, CheckCircle2, Moon } from 'lucide-react';
import { RoomData } from "@/types/rooms";
import { cn } from "@/lib/utils";

interface RoomCardProps {
    roomNumber: string;
    data?: RoomData;
}

export function RoomCard({ roomNumber, data }: RoomCardProps) {
    const isOccupied = !!data;

    return (
        <div
            className={cn(
                "group relative flex items-stretch overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer h-24",
                isOccupied
                    ? "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 hover:shadow-lg hover:ring-blue-200"
                    : "bg-slate-50/40 ring-1 ring-slate-100/80 hover:bg-white hover:ring-emerald-200 hover:shadow-md"
            )}
        >
            {/* 1. ROOM IDENTITY (Left Section) */}
            <div className={cn(
                "w-20 flex flex-col items-center justify-center border-r transition-colors",
                isOccupied ? "bg-slate-50/50 border-slate-100" : "bg-transparent border-slate-100/50"
            )}>
                <span className={cn(
                    "text-2xl font-black tracking-tighter leading-none mb-1",
                    isOccupied ? "text-slate-900" : "text-slate-300 group-hover:text-emerald-500"
                )}>
                    {roomNumber}
                </span>
                {isOccupied && (
                    <div className="h-1 w-8 rounded-full bg-blue-500" />
                )}
            </div>

            {/* 2. MAIN CONTENT (Center & Right) */}
            <div className="flex-1 flex flex-col justify-center px-5 py-3 gap-1.5 min-w-0">

                {/* Top Row: User or Status */}
                <div className="flex items-center justify-between gap-4">
                    {isOccupied ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 truncate tracking-tight">
                                {data?.huesped || 'Huésped'}
                            </span>
                        </div>
                    ) : (
                        <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Disponible
                        </span>
                    )}

                    {/* ROI / Price Tag */}
                    {isOccupied && data?.roi && (
                        <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md tracking-tight">
                            ${data.roi}
                        </span>
                    )}
                </div>

                {/* Bottom Row: Metadata */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-0.5">
                    {isOccupied && data ? (
                        <>
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span className="text-[11px] font-bold">{data.adultos + data.ninos}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Moon className="h-3 w-3" />
                                    <span className="text-[11px] font-medium">2n</span>
                                </div>
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                Ocupado
                            </div>
                        </>
                    ) : (
                        <div className="w-full text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-widest group-hover:text-emerald-400 transition-colors">
                                Listo para venta
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Occupied Accent Line (Bottom) */}
            {isOccupied && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
        </div>
    );
}
