// Tower Tasks Management Page
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { taskService } from '@/services/tasks';
import { apiRequest } from '@/lib/api';
import type { Task, TaskTemplate, TaskStats, CreateTaskPayload, TaskStatus, TaskPriority } from '@/types/tasks';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/tasks';
import {
    ClipboardList, Plus, Filter, Calendar, Users, MapPin,
    Clock, CheckCircle2, AlertTriangle, X, ChevronDown,
    Play, Eye, Trash2, BarChart3, ListChecks,
} from 'lucide-react';

interface EmployeeOption { id: string; fullName: string; employeeCode: string }
interface AreaOption { id: string; name: string; type: string }

export default function TowerTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [areas, setAreas] = useState<AreaOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterArea, setFilterArea] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const fetchTasks = useCallback(async () => {
        try {
            const res = await taskService.listTasks({
                status: filterStatus || undefined,
                area_id: filterArea || undefined,
                assigned_to: filterEmployee || undefined,
                due_date: filterDate || undefined,
                limit: 100,
            });
            setTasks(res.data?.data || []);
        } catch (err) {
            toast.error('Error al cargar tareas');
        }
    }, [filterStatus, filterArea, filterEmployee, filterDate]);

    const fetchStats = async () => {
        try {
            const res = await taskService.getStats();
            setStats(res.data);
        } catch { /* stats are optional */ }
    };

    const fetchOptions = async () => {
        try {
            const [empRes, areaRes, tplRes] = await Promise.all([
                apiRequest('/config/employees'),
                apiRequest('/config/areas'),
                taskService.listTemplates(),
            ]);
            setEmployees((empRes as { data: EmployeeOption[] }).data || []);
            setAreas((areaRes as { data: AreaOption[] }).data || []);
            setTemplates(tplRes.data || []);
        } catch { /* options load silently */ }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchTasks(), fetchStats(), fetchOptions()]);
            setLoading(false);
        };
        load();
    }, [fetchTasks]);

    useEffect(() => {
        fetchTasks();
    }, [filterStatus, filterArea, filterEmployee, filterDate, fetchTasks]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Cancelar esta tarea?')) return;
        try {
            await taskService.deleteTask(id);
            toast.success('Tarea cancelada');
            fetchTasks();
            fetchStats();
        } catch {
            toast.error('Error al cancelar');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Tareas</h1>
                    <p className="text-slate-500 text-sm mt-1">Asigna, monitorea y gestiona tareas del equipo operativo</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-4 h-4" /> Nueva Tarea
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard label="Total" value={stats.total} icon={<ClipboardList className="w-5 h-5" />} color="slate" />
                    <StatCard label="Pendientes" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
                    <StatCard label="En Progreso" value={stats.in_progress} icon={<Play className="w-5 h-5" />} color="blue" />
                    <StatCard label="Completadas" value={stats.completed} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
                    <StatCard label="Vencidas" value={stats.overdue} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
                </div>
            )}

            {/* Compliance */}
            {stats && stats.total > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">Cumplimiento Semanal</span>
                            <span className="text-sm font-bold text-blue-600">{stats.compliance_rate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${stats.compliance_rate}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Filtros</span>
                    {(filterStatus || filterArea || filterEmployee || filterDate) && (
                        <button onClick={() => { setFilterStatus(''); setFilterArea(''); setFilterEmployee(''); setFilterDate(''); }} className="text-xs text-blue-600 hover:underline ml-auto">
                            Limpiar filtros
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>
                    <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Todas las áreas</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Todos los empleados</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>)}
                    </select>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>

            {/* Task Table */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <ClipboardList className="w-12 h-12 mb-3 opacity-40" />
                        <p className="text-sm font-medium">No hay tareas</p>
                        <p className="text-xs mt-1">Crea una nueva tarea para empezar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Tarea</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Asignado a</th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Área</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Estado</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Prioridad</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Fecha</th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Checklist</th>
                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tasks.map(task => {
                                    const statusCfg = STATUS_CONFIG[task.status];
                                    const priorityCfg = PRIORITY_CONFIG[task.priority];
                                    const checklistTotal = task.checklist_items?.length || 0;
                                    const checklistDone = task.checklist_items?.filter(i => i.is_completed).length || 0;

                                    return (
                                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-8 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-400' : task.status === 'OVERDUE' ? 'bg-red-400' : task.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                                        {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Users className="w-3.5 h-3.5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-700">{task.assignee?.full_name || 'Sin asignar'}</p>
                                                        {task.assignee && <p className="text-xs text-slate-400">{task.assignee.employee_code}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 hidden lg:table-cell">
                                                {task.area ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                        <MapPin className="w-3 h-3" /> {task.area.name}
                                                    </span>
                                                ) : <span className="text-xs text-slate-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${statusCfg.color} ${statusCfg.bg}`}>
                                                    {statusCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                                                <span className="text-sm">{priorityCfg.icon}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center hidden md:table-cell">
                                                {task.due_date ? (
                                                    <div className="text-xs text-slate-600">
                                                        <p>{new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                                                        {task.due_time && <p className="text-slate-400">{task.due_time}</p>}
                                                    </div>
                                                ) : <span className="text-xs text-slate-400">Sin fecha</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {checklistTotal > 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                                                        <ListChecks className="w-3.5 h-3.5" />
                                                        {checklistDone}/{checklistTotal}
                                                    </span>
                                                ) : <span className="text-xs text-slate-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Cancelar tarea"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTaskModal
                    employees={employees}
                    areas={areas}
                    templates={templates}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); fetchTasks(); fetchStats(); }}
                />
            )}
        </div>
    );
}

// ─── Stat Card ──────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colorMap: Record<string, string> = {
        slate: 'bg-slate-50 text-slate-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
            </div>
        </div>
    );
}

// ─── Create Task Modal ──────────────────
function CreateTaskModal({ employees, areas, templates, onClose, onCreated }: {
    employees: EmployeeOption[];
    areas: AreaOption[];
    templates: TaskTemplate[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [areaId, setAreaId] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(2);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueTime, setDueTime] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [checklist, setChecklist] = useState<{ label: string; is_required: boolean }[]>([]);
    const [newItem, setNewItem] = useState('');
    const [saving, setSaving] = useState(false);

    const handleTemplateSelect = (id: string) => {
        setTemplateId(id);
        const tpl = templates.find(t => t.id === id);
        if (tpl) {
            if (!title) setTitle(tpl.title);
            if (!description && tpl.description) setDescription(tpl.description);
            if (!areaId && tpl.area_id) setAreaId(tpl.area_id);
            if (tpl.priority) setPriority(tpl.priority);
            if (tpl.checklist_template && checklist.length === 0) {
                setChecklist(tpl.checklist_template.map(i => ({ label: i.label, is_required: i.required })));
            }
        }
    };

    const addChecklistItem = () => {
        if (!newItem.trim()) return;
        setChecklist(prev => [...prev, { label: newItem.trim(), is_required: false }]);
        setNewItem('');
    };

    const removeChecklistItem = (index: number) => {
        setChecklist(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { toast.error('El título es obligatorio'); return; }

        setSaving(true);
        try {
            const payload: CreateTaskPayload = {
                title: title.trim(),
                description: description || undefined,
                assigned_to: assignedTo || undefined,
                area_id: areaId || undefined,
                template_id: templateId || undefined,
                priority,
                due_date: dueDate || undefined,
                due_time: dueTime || undefined,
                checklist: checklist.length > 0 ? checklist : undefined,
            };
            await taskService.createTask(payload);
            toast.success('Tarea creada exitosamente');
            onCreated();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear tarea';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Nueva Tarea</h2>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Template selector */}
                    {templates.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desde Plantilla (opcional)</label>
                            <select value={templateId} onChange={e => handleTemplateSelect(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900">
                                <option value="">Crear desde cero</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Título *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Limpieza profunda habitación 301" className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
                    </div>

                    {/* Grid: Employee + Area */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asignar a</label>
                            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900">
                                <option value="">Sin asignar</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Área</label>
                            <select value={areaId} onChange={e => setAreaId(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900">
                                <option value="">Sin área</option>
                                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Grid: Priority + Date + Time */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prioridad</label>
                            <select value={priority} onChange={e => setPriority(Number(e.target.value) as TaskPriority)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900">
                                <option value={1}>🔴 Urgente</option>
                                <option value={2}>🔵 Normal</option>
                                <option value={3}>⚪ Baja</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hora</label>
                            <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900" />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Checklist</label>
                        <div className="mt-1 space-y-2">
                            {checklist.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                                    <ListChecks className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                                    {item.is_required && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">REQ</span>}
                                    <button type="button" onClick={() => removeChecklistItem(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} placeholder="Agregar item..." className="flex-1 h-9 rounded-lg border border-dashed border-slate-200 bg-white px-3 text-sm text-slate-900" />
                                <button type="button" onClick={addChecklistItem} className="px-3 h-9 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={saving} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                        {saving ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" /> Crear Tarea
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
