'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Map as MapIcon, Factory, Warehouse, MoreVertical, Trash2, Package, RefreshCcw, Activity, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { configApi } from '@/lib/api';

interface Area {
    id: string;
    name: string;
    type: 'SOURCE' | 'PROCESSOR';
    description?: string;
    isActive: boolean;
    code?: string;
}

export default function AreasPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'PROCESSOR' as 'SOURCE' | 'PROCESSOR',
        description: ''
    });

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            const response = await configApi.areas.list();
            // API now returns full response object { data: [], pagination: {} }
            setAreas(response.data || []);
        } catch (error) {
            toast.error('Error al cargar áreas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsSubmitting(true);
        try {
            await configApi.areas.create(formData);
            toast.success('Área creada correctamente');
            setIsCreateOpen(false);
            setFormData({ name: '', type: 'PROCESSOR', description: '' });
            fetchAreas();
        } catch (error) {
            toast.error('Error al crear el área');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar PERMANENTEMENTE esta área? Esta acción no se puede deshacer.')) return;

        try {
            await configApi.areas.delete(id);
            toast.success('Área eliminada');
            fetchAreas();
        } catch (error) {
            toast.error('Error al eliminar área');
        }
    };

    const filteredAreas = areas.filter(area =>
        area.name.toLowerCase().includes(search.toLowerCase()) ||
        area.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 slides-in-from-bottom-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Áreas</h1>
                    <p className="text-slate-500 text-lg">Configura las zonas físicas y lógicas operativas del hotel.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium px-6">
                                <Plus className="w-5 h-5 mr-2" />
                                Nueva Área
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0 overflow-hidden border-0 shadow-2xl sm:rounded-2xl gap-0">
                            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-bold text-slate-900">Registrar Nueva Área</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Nombre del Área</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Cocina Principal"
                                        className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Tipo de Operación</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'SOURCE' })}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${formData.type === 'SOURCE'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm ring-1 ring-blue-500/20'
                                                : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full ${formData.type === 'SOURCE' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-bold block">Origen (Demanda)</span>
                                                <span className="text-[10px] opacity-70">Camareras, Limpieza</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'PROCESSOR' })}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${formData.type === 'PROCESSOR'
                                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/20'
                                                : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-full ${formData.type === 'PROCESSOR' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-sm font-bold block">Operación (Suministro)</span>
                                                <span className="text-[10px] opacity-70">Lavandería, Cocina</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Descripción <span className="text-slate-400 font-normal">(Opcional)</span></label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detalles operativos..."
                                        className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 font-medium">
                                        {isSubmitting ? 'Guardando...' : 'Crear Área'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter */}
            <div className="relative max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                    placeholder="Buscar áreas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 w-full bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-xl"
                />
            </div>

            {/* Grid Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAreas.map((area) => (
                        <div key={area.id} className="group relative bg-white hover:bg-slate-50/50 rounded-2xl p-6 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-start gap-4">

                            {/* Top Row: Icon & Menu */}
                            <div className="flex justify-between items-start w-full">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${area.type === 'SOURCE'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-indigo-50 text-indigo-600'
                                    }`}>
                                    {area.type === 'SOURCE' ? <Package className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        onClick={() => handleDelete(area.id)}
                                        title="Eliminar Área Permanentemente"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-1 w-full">
                                <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                                    {area.name}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-2 h-10 leading-relaxed">
                                    {area.description || "Sin descripción operativa disponible."}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="w-full pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${area.type === 'SOURCE'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {area.type === 'SOURCE' ? 'ORIGEN' : 'OPERACIÓN'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/tower/areas/${area.id}`} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center">
                                        Bitácora <ArrowUpRight className="w-3 h-3 ml-1" />
                                    </Link>
                                </div>
                                {!area.isActive && (
                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">INACTIVO</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredAreas.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapIcon className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">No se encontraron áreas</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Prueba ajustando los filtros de búsqueda o crea una nueva área operativa.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
