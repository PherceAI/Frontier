// Hands - Employee Tasks Page (Mobile-First)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { Task, TaskChecklistItem } from '@/types/tasks';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/types/tasks';
import {
    ClipboardList, ChevronLeft, Clock, CheckCircle2,
    AlertTriangle, Play, Check, ChevronDown, ChevronUp,
    MessageSquare, ArrowRight, Loader2
} from 'lucide-react';
import HandsBottomNav from '@/components/hands/HandsBottomNav';

export default function HandsTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<{
        in_progress: Task[];
        pending: Task[];
        overdue: Task[];
        completed: Task[];
    }>({ in_progress: [], pending: [], overdue: [], completed: [] });
    const [summary, setSummary] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            const { opsService } = await import('@/services/operations');
            const res = await opsService.getMyTasks();
            setTasks(res.data.tasks);
            setSummary(res.data.summary);
        } catch {
            toast.error('Error al cargar tareas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('sessionToken');
        if (!token) { router.push('/hands'); return; }
        fetchTasks();
    }, [router, fetchTasks]);

    const handleStart = async (taskId: string) => {
        setActionLoading(taskId);
        try {
            const { opsService } = await import('@/services/operations');
            await opsService.startTask(taskId);
            if (navigator.vibrate) navigator.vibrate(50);
            toast.success('Tarea iniciada');
            fetchTasks();
        } catch {
            toast.error('Error al iniciar tarea');
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (taskId: string) => {
        setActionLoading(taskId);
        try {
            const { opsService } = await import('@/services/operations');
            await opsService.completeTask(taskId, completionNotes || undefined);
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
            toast.success('🎉 Tarea completada');
            setCompletionNotes('');
            setExpandedTask(null);
            fetchTasks();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al completar';
            toast.error(message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleChecklist = async (taskId: string, itemId: number) => {
        try {
            const { opsService } = await import('@/services/operations');
            await opsService.toggleChecklistItem(taskId, itemId);
            if (navigator.vibrate) navigator.vibrate(10);
            fetchTasks();
        } catch {
            toast.error('Error al actualizar checklist');
        }
    };

    const handleBack = () => {
        const employeeData = localStorage.getItem('employee');
        if (employeeData) {
            try {
                const employee = JSON.parse(employeeData);
                const areas = employee.areas || [];
                const isLaundry = areas.some((a: { type: string }) => a.type === 'PROCESSOR');
                const isHousekeeping = areas.some((a: { type: string }) => a.type === 'SOURCE');
                if (isLaundry) return router.push('/hands/laundry');
                if (isHousekeeping) return router.push('/hands/housekeeping');
            } catch { /* fallback */ }
        }
        router.push('/hands');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    const allTasks = [
        ...tasks.in_progress,
        ...tasks.overdue,
        ...tasks.pending,
        ...tasks.completed,
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white font-[family-name:var(--font-outfit)]">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={handleBack} className="p-2 -ml-2 rounded-xl hover:bg-white/5 active:scale-95 transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">Mis Tareas</h1>
                        <p className="text-xs text-gray-500">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <ClipboardList className="w-5 h-5 text-blue-500" />
                </div>

                {/* Summary Pills */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    <SummaryPill label="Pendientes" value={summary.pending} color="amber" />
                    <SummaryPill label="En Progreso" value={summary.in_progress} color="blue" />
                    <SummaryPill label="Completas" value={summary.completed} color="emerald" />
                    {summary.overdue > 0 && <SummaryPill label="Vencidas" value={summary.overdue} color="red" />}
                </div>
            </div>

            {/* Task List */}
            <div className="px-4 py-4 space-y-3 pb-20">
                {allTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                        <CheckCircle2 className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-base font-medium">Sin tareas por hoy</p>
                        <p className="text-sm text-gray-700 mt-1">¡Buen trabajo! 👏</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {allTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                isExpanded={expandedTask === task.id}
                                onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                                onStart={() => handleStart(task.id)}
                                onComplete={() => handleComplete(task.id)}
                                onToggleChecklist={(itemId) => handleToggleChecklist(task.id, itemId)}
                                completionNotes={completionNotes}
                                onNotesChange={setCompletionNotes}
                                isActionLoading={actionLoading === task.id}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Bottom Navigation */}
            <HandsBottomNav />
        </div>
    );
}



// ─── Summary Pill ──────────────────
function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${colors[color]}`}>
            <span className="text-base font-bold">{value}</span>
            {label}
        </div>
    );
}

// ─── Task Card ──────────────────
function TaskCard({ task, isExpanded, onToggle, onStart, onComplete, onToggleChecklist, completionNotes, onNotesChange, isActionLoading }: {
    task: Task;
    isExpanded: boolean;
    onToggle: () => void;
    onStart: () => void;
    onComplete: () => void;
    onToggleChecklist: (itemId: number) => void;
    completionNotes: string;
    onNotesChange: (v: string) => void;
    isActionLoading: boolean;
}) {
    const statusColors: Record<string, string> = {
        PENDING: 'border-l-amber-400',
        IN_PROGRESS: 'border-l-blue-400',
        COMPLETED: 'border-l-emerald-400',
        OVERDUE: 'border-l-red-400',
        CANCELLED: 'border-l-gray-600',
    };

    const priorityCfg = PRIORITY_CONFIG[task.priority];
    const checklistItems = task.checklist_items || [];
    const checklistDone = checklistItems.filter(i => i.is_completed).length;
    const canStart = task.status === 'PENDING' || task.status === 'OVERDUE';
    const canComplete = task.status === 'IN_PROGRESS';
    const isDone = task.status === 'COMPLETED';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl bg-gray-900 border border-white/5 border-l-4 ${statusColors[task.status]} overflow-hidden ${isDone ? 'opacity-60' : ''}`}
        >
            {/* Header */}
            <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left active:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{priorityCfg.icon}</span>
                        <h3 className={`text-sm font-semibold truncate ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {task.area && <span className="text-xs text-gray-500">{task.area.name}</span>}
                        {task.due_time && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" /> {task.due_time}
                            </span>
                        )}
                        {checklistItems.length > 0 && (
                            <span className="text-xs text-gray-500">{checklistDone}/{checklistItems.length} items</span>
                        )}
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                            {/* Description */}
                            {task.description && (
                                <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
                            )}

                            {/* Checklist */}
                            {checklistItems.length > 0 && (
                                <div className="space-y-1.5">
                                    {checklistItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => !isDone && onToggleChecklist(item.id)}
                                            disabled={isDone}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${item.is_completed ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.is_completed ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>
                                                {item.is_completed && <Check className="w-4 h-4" />}
                                            </div>
                                            <span className={`text-sm text-left flex-1 ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                                {item.label}
                                            </span>
                                            {item.is_required && !item.is_completed && (
                                                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">REQ</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Completion Notes */}
                            {canComplete && (
                                <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                                    <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                    <textarea
                                        value={completionNotes}
                                        onChange={e => onNotesChange(e.target.value)}
                                        placeholder="Notas de completamiento (opcional)..."
                                        rows={2}
                                        className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-600 resize-none outline-none"
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            {canStart && (
                                <button
                                    onClick={onStart}
                                    disabled={isActionLoading}
                                    className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-4 h-4" /> Iniciar Tarea</>}
                                </button>
                            )}

                            {canComplete && (
                                <button
                                    onClick={onComplete}
                                    disabled={isActionLoading}
                                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Completar Tarea</>}
                                </button>
                            )}

                            {isDone && task.completion_notes && (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">Notas de completamiento:</p>
                                    <p className="text-sm text-gray-400">{task.completion_notes}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
