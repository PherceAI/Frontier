'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface TaskItem {
    id: number;
    label: string;
    is_completed: boolean;
    is_required: boolean;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    due_date: string;
    priority: number;
    checklistItems: TaskItem[];
}

export default function TasksView() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const res = await api.operations.tasks.listMyTasks();
            if (res) {
                setTasks(res);
            }
        } catch (error) {
            console.error("Error loading tasks", error);
            toast.error("Error al cargar las tareas asignadas.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = async (taskId: string, itemId: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Optimistic update
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const newItems = task.checklistItems.map(item =>
                    item.id === itemId ? { ...item, is_completed: newStatus } : item
                );
                return { ...task, checklistItems: newItems };
            }
            return task;
        }));

        if (navigator.vibrate) navigator.vibrate(10);

        try {
            await api.operations.tasks.toggleItem(taskId, itemId, newStatus);

            // Check if all items are completed now
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const updatedItems = task.checklistItems.map(i => i.id === itemId ? { ...i, is_completed: newStatus } : i);
                const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.is_completed);
                if (allCompleted && task.status !== 'COMPLETED') {
                    await api.operations.tasks.updateStatus(taskId, 'COMPLETED');
                    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED' } : t));
                    toast.success("¡Tarea marcada como completada!");
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                }
            }

        } catch (error) {
            console.error("Error toggling item", error);
            toast.error("No se pudo actualizar el estado.");
            // Revert optimistic update by reloading
            loadTasks();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
            case 'IN_PROGRESS': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
            case 'OVERDUE': return 'text-red-500 bg-red-50 dark:bg-red-500/10';
            default: return 'text-slate-500 bg-slate-100 dark:bg-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'Completada';
            case 'IN_PROGRESS': return 'En Progreso';
            case 'OVERDUE': return 'Atrasada';
            default: return 'Pendiente';
        }
    };

    return (
        <div className="pb-24 pt-6 px-4 max-w-lg mx-auto min-h-screen">

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mis Tareas</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Objetivos de tu turno (Camareras)</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl h-32 animate-pulse" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-white/5 mt-8">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 dark:text-emerald-500/50" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">¡Todo al día!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">No tienes tareas asignadas por el momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => {
                        const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';

                        return (
                            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden relative">

                                <div className="flex items-start justify-between mb-3">
                                    <div className="pr-4">
                                        <h3 className={`font-bold text-lg leading-tight mb-1 ${task.status === 'COMPLETED' ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{task.description}</p>
                                        )}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(task.status)}`}>
                                        {getStatusText(task.status)}
                                    </div>
                                </div>

                                {/* Due Date Warning if needed */}
                                {isOverdue && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-3 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-md w-fit">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        La tarea está vencida
                                    </div>
                                )}

                                {/* Checklist */}
                                {task.checklistItems && task.checklistItems.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {task.checklistItems.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleItem(task.id, item.id, item.is_completed)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${item.is_completed
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                                                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <div className={`shrink-0 transition-colors ${item.is_completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-500'}`}>
                                                    {item.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                </div>
                                                <span className={`text-sm font-medium ${item.is_completed
                                                    ? 'text-slate-500 dark:text-slate-400 line-through decoration-emerald-200 dark:decoration-emerald-900/50'
                                                    : 'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {item.label}
                                                    {item.is_required && <span className="text-red-400 ml-1">*</span>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
