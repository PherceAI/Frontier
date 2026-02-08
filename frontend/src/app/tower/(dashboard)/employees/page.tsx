'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, User, Users, MoreVertical,
    Trash2, RefreshCw, KeyRound, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { configApi } from '@/lib/api';

interface Employee {
    id: string;
    fullName: string;
    employeeCode: string;
    isActive: boolean;
    // accessPinPlain removed
    areas?: { id: string; name: string }[];
}

interface Area {
    id: string;
    name: string;
    isActive: boolean;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        employeeCode: '',
        areaIds: [] as string[]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [empResponse, areaResponse] = await Promise.all([
                configApi.employees.list(),
                configApi.areas.list({ isActive: 'true' })
            ]);
            // API now returns full response object { data: [], pagination: {} }
            setEmployees(empResponse?.data || []);
            setAreas(areaResponse?.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar datos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        if (areas.length === 0) {
            toast.warning(
                <div className="flex flex-col gap-2">
                    <span className="font-bold">Acción Requerida</span>
                    <span>Primero debe registrar Áreas de Trabajo (ej. "Lavandería", "Pisos") para poder asignar colaboradores.</span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
                        onClick={() => window.location.href = '/tower/areas'}
                    >
                        Ir a Gestión de Áreas
                    </Button>
                </div>,
                { duration: 8000 }
            );
            return;
        }
        setIsCreateOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName) return;

        // Safety check just in case
        if (areas.length === 0) {
            toast.error("No hay áreas disponibles.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                fullName: formData.fullName,
                ...(formData.areaIds.length > 0 ? { areaIds: formData.areaIds } : {}),
                ...(formData.employeeCode ? { employeeCode: formData.employeeCode } : {})
            };
            console.log('Sending payload:', JSON.stringify(payload, null, 2));
            const newEmp: any = await configApi.employees.create(payload);
            // Backend returns generatedPin only on creation response
            const pin = newEmp.generatedPin;

            toast.success(
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-base">¡Colaborador Registrado!</span>
                    <span>Comparta el PIN de acceso:</span>
                    <span className="text-xl font-mono font-bold bg-white/20 p-2 rounded text-center tracking-widest border border-white/20 select-text cursor-text">{pin}</span>
                    <span className="text-xs opacity-80">Este PIN solo se muestra una vez.</span>
                </div>,
                { duration: 20000 }
            );

            setIsCreateOpen(false);
            setFormData({ fullName: '', employeeCode: '', areaIds: [] });
            loadData();

        } catch (error: any) {
            console.error('Create error:', error);
            if (error.response?.data?.message) {
                console.error('Validation details:', error.response.data.message);
            }

            const resData = error.response?.data;
            const errorObj = resData?.error;
            const messageRaw = errorObj?.message || resData?.message;

            const msg = Array.isArray(messageRaw)
                ? messageRaw.join(', ')
                : (messageRaw || 'Error al registrar colaborador');

            // Specific handling for duplicate code
            if (msg.includes('user_code_unique') || msg.includes('Project code already exists')) {
                toast.error(`El código "${formData.employeeCode}" ya está en uso.`);
            } else {
                toast.error(`Error: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAreaSelection = (areaId: string) => {
        setFormData(prev => ({
            ...prev,
            areaIds: prev.areaIds.includes(areaId)
                ? prev.areaIds.filter(id => id !== areaId)
                : [...prev.areaIds, areaId]
        }));
    };

    const handleResetPin = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent dropdown auto-close quirks if any
        try {
            const result: any = await configApi.employees.resetPin(id);
            const newPin = result.newPin;

            if (newPin) {
                toast.info(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold">PIN Restablecido</span>
                        <span className="text-lg font-mono tracking-widest bg-blue-50 text-blue-800 p-1 rounded text-center select-text cursor-text">{newPin}</span>
                    </div>,
                    { duration: 10000 }
                );
            } else {
                toast.success('PIN restablecido correctamente');
            }
        } catch (error: any) {
            const resData = error.response?.data;
            const msg = resData?.error?.message || resData?.message || 'Error al restablecer PIN';
            toast.error(msg);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm('¿Estás seguro de eliminar permanentemente a este colaborador? Esta acción no se puede deshacer.')) return;
        try {
            await configApi.employees.delete(id);
            toast.success('Colaborador eliminado correctamente');
            loadData();
        } catch (error: any) {
            const resData = error.response?.data;
            const msg = resData?.error?.message || resData?.message || 'Error al eliminar';
            toast.error(msg);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        // Safety check for null/undefined strings
        const nameMatch = emp.fullName?.toLowerCase().includes(search.toLowerCase()) ?? false;
        const codeMatch = emp.employeeCode?.toLowerCase().includes(search.toLowerCase()) ?? false;
        return nameMatch || codeMatch;
    });

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 slides-in-from-bottom-4">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registro de Personal</h1>
                    <p className="text-slate-500 text-lg">Administra accesos y asignaciones operativas del hotel.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Button
                            onClick={handleOpenCreate}
                            size="lg"
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium px-6"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nuevo Colaborador
                        </Button>
                        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl sm:rounded-2xl gap-0">
                            <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-bold text-slate-900">Registrar Nuevo Colaborador</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Nombre Completo</label>
                                        <Input
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="Ej. Juan Pérez"
                                            className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700">Asignar Áreas</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                                        {areas.map(area => (
                                            <div
                                                key={area.id}
                                                onClick={() => toggleAreaSelection(area.id)}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border select-none ${formData.areaIds.includes(area.id)
                                                    ? 'bg-blue-50/80 border-blue-200 shadow-sm'
                                                    : 'border-transparent hover:bg-white hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.areaIds.includes(area.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                                                    }`}>
                                                    {formData.areaIds.includes(area.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className={`text-sm font-medium truncate ${formData.areaIds.includes(area.id) ? 'text-blue-700' : 'text-slate-600'}`}>{area.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/20">
                                        {isSubmitting ? 'Procesando...' : 'Confirmar Registro'}
                                    </Button>
                                    <p className="text-center text-xs text-slate-400 mt-4">
                                        Se generará un PIN de acceso único automáticamente.
                                    </p>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Buscar por nombre, ID o área..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 w-full bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-lg"
                    />
                </div>
                <div className="text-sm text-slate-400 font-medium">
                    Total: <span className="text-slate-900">{filteredEmployees.length}</span> activos
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 animate-pulse">
                            <div className="h-12 w-12 bg-slate-100 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                                <div className="h-3 w-1/3 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))
                ) : (
                    filteredEmployees.map((emp) => (
                        <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm bg-slate-100">
                                        <AvatarFallback className="text-slate-600 bg-slate-100 font-bold text-sm">
                                            {emp.fullName?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{emp.fullName}</h3>
                                        <p className="text-xs text-slate-500 font-mono">{emp.employeeCode}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleResetPin(emp.id, e); }}>
                                            <KeyRound className="w-4 h-4 mr-2" /> Regenerar PIN
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={(e) => { e.preventDefault(); handleDelete(emp.id, e); }}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between text-sm border-t border-slate-50 pt-3">
                                <div className="flex items-center gap-1.5 text-slate-600">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    {emp.areas?.length ? emp.areas.map(a => a.name).join(', ') : <span className="text-amber-500">Sin área</span>}
                                </div>
                                {emp.isActive ? (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">ACTIVO</span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">INACTIVO</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                            <TableHead className="w-[350px] py-4 pl-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Colaborador</TableHead>
                            <TableHead className="py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Credencial (ID)</TableHead>
                            {/* PIN Column Removed */}
                            <TableHead className="py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Estado</TableHead>
                            <TableHead className="text-right py-4 pr-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => (
                                <TableRow key={i}>
                                    <TableCell className="pl-6"><div className="flex items-center gap-3"><div className="h-9 w-9 bg-slate-100 rounded-full animate-pulse" /><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 rounded animate-pulse" /><div className="h-3 w-20 bg-slate-100 rounded animate-pulse" /></div></div></TableCell>
                                    <TableCell><div className="h-6 w-20 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    {/* PIN Skeleton Removed */}
                                    <TableCell><div className="h-6 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
                                    <TableCell className="text-right pr-6"><div className="h-8 w-8 bg-slate-100 rounded animate-pulse ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredEmployees.map((emp) => (
                                <TableRow key={emp.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50/50 last:border-0 border-slate-100">
                                    <TableCell className="pl-6 py-3">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm bg-slate-100">
                                                <AvatarFallback className="text-slate-600 bg-slate-100 font-bold text-sm">
                                                    {emp.fullName?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{emp.fullName}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                    <Users className="w-3 h-3" />
                                                    {emp.areas?.length ? emp.areas.map(a => a.name).join(', ') : <span className="text-amber-600 font-medium">⚠️ Sin asignación</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 px-2 py-1">
                                            {emp.employeeCode}
                                        </Badge>
                                    </TableCell>
                                    {/* PIN Cell Removed */}
                                    <TableCell>
                                        {emp.isActive ? (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                Activo
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Inactivo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-white data-[state=open]:bg-slate-100 transition-all">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-100 p-1">
                                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleResetPin(emp.id, e); }} className="cursor-pointer font-medium p-2 text-slate-700 focus:bg-slate-50">
                                                    <KeyRound className="w-4 h-4 mr-2 text-slate-400" /> Regenerar PIN
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium p-2" onClick={(e) => { e.preventDefault(); handleDelete(emp.id, e); }}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar Cuenta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}

                        {!isLoading && filteredEmployees.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                            <Search className="w-6 h-6 opacity-50" />
                                        </div>
                                        <span className="font-semibold text-slate-600 mb-1">Sin resultados encontrados</span>
                                        <span className="text-sm">No hay colaboradores que coincidan con tu búsqueda.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
