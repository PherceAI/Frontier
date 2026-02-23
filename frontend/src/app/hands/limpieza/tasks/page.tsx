'use client';

import { useState, useRef, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Circle, AlertCircle, Camera, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface TaskItem {
    id: number;
    label: string;
    is_completed: boolean;
    is_required: boolean;
    evidence_url?: string;
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

    // UI Local State for completion in one go
    const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
    const [pendingPhotos, setPendingPhotos] = useState<Record<number, File>>({});
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        try {
            const res = await api.operations.tasks.listMyTasks();
            if (res) setTasks(res);
        } catch (error) {
            console.error("Error loading tasks", error);
            toast.error("Error al cargar las tareas asignadas.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocalToggle = (itemId: number) => {
        setPendingChecks(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const handleLocalPhotoSelect = (itemId: number, file: File) => {
        setPendingPhotos(prev => ({
            ...prev,
            [itemId]: file
        }));
    };

    const submitTask = async (task: Task) => {
        if (!task.checklistItems || task.checklistItems.length === 0) {
            // Unlikely for Limpieza, but just in case
            completeTaskDirectly(task.id);
            return;
        }

        // Validate requirement
        for (const item of task.checklistItems) {
            const isChecked = pendingChecks[item.id] || item.is_completed;
            if (item.is_required && !isChecked) {
                toast.error(`El elemento "${item.label}" es obligatorio.`);
                return;
            }
        }

        setCompletingTaskId(task.id);

        try {
            // Upload photos first
            const photoPromises = task.checklistItems
                .filter(i => pendingPhotos[i.id] !== undefined)
                .map(async (i) => {
                    const file = pendingPhotos[i.id];
                    const formData = new FormData();
                    formData.append('file', file);

                    const sessionToken = localStorage.getItem('sessionToken') || '';
                    const res = await fetch(`/api/operations/tasks/${task.id}/items/${i.id}/evidence`, {
                        method: 'POST',
                        headers: {
                            'x-session-token': sessionToken
                        },
                        body: formData
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                        throw new Error(data.error || 'Error subiendo foto');
                    }
                });

            await Promise.all(photoPromises);

            // Save checklists locally modified
            const checkPromises = task.checklistItems
                .filter(i => pendingChecks[i.id] !== undefined && pendingChecks[i.id] !== i.is_completed)
                .map(i => api.operations.tasks.toggleItem(task.id, i.id, pendingChecks[i.id]!));

            await Promise.all(checkPromises);

            // Finish the task
            await api.operations.tasks.updateStatus(task.id, 'COMPLETED');

            toast.success('¡Tarea de Limpieza Completada!');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Clean state & Reload
            setPendingChecks(prev => {
                const next = { ...prev };
                task.checklistItems.forEach(i => delete next[i.id]);
                return next;
            });
            setPendingPhotos(prev => {
                const next = { ...prev };
                task.checklistItems.forEach(i => delete next[i.id]);
                return next;
            });
            loadTasks();

        } catch (error) {
            console.error("Error submitting", error);
            toast.error('Ocurrió un error guardando la tarea. Intenta de nuevo.');
        } finally {
            setCompletingTaskId(null);
        }
    };

    const completeTaskDirectly = async (taskId: string) => {
        setCompletingTaskId(taskId);
        try {
            await api.operations.tasks.updateStatus(taskId, 'COMPLETED');
            toast.success('¡Tarea de Limpieza Completada!');
            loadTasks();
        } catch {
            toast.error('Ocurrió un error al completar.');
        } finally {
            setCompletingTaskId(null);
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Actividades de turno (Limpieza)</p>
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
                <div className="space-y-6">
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

                                {isOverdue && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-3 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-md w-fit">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        La tarea está vencida
                                    </div>
                                )}

                                {/* Checklist */}
                                {task.checklistItems && task.checklistItems.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {task.checklistItems.map(item => {
                                            const isChecked = pendingChecks[item.id] !== undefined ? pendingChecks[item.id] : item.is_completed;
                                            const pendingPhoto = pendingPhotos[item.id];

                                            return (
                                                <div key={item.id} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isChecked
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                                                    : 'bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-transparent'
                                                    }`}>

                                                    <button
                                                        disabled={task.status === 'COMPLETED'}
                                                        type="button"
                                                        onClick={() => handleLocalToggle(item.id)}
                                                        className="flex items-center gap-3 text-left flex-1"
                                                    >
                                                        <div className={`shrink-0 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-500'}`}>
                                                            {isChecked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                        </div>
                                                        <span className={`text-sm font-medium ${isChecked
                                                            ? 'text-slate-500 dark:text-slate-400 line-through decoration-emerald-200 dark:decoration-emerald-900/50'
                                                            : 'text-slate-700 dark:text-slate-300'
                                                            }`}>
                                                            {item.label}
                                                            {item.is_required && <span className="text-red-400 ml-1">*</span>}
                                                        </span>
                                                    </button>

                                                    {/* Evidence Section */}
                                                    <div className="shrink-0 flex items-center gap-2 ml-3 pl-3">
                                                        {item.evidence_url ? (
                                                            <a href={item.evidence_url} target="_blank" rel="noopener noreferrer"
                                                                className="text-emerald-500 hover:text-emerald-600 bg-emerald-100/50 dark:bg-emerald-500/20 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold">
                                                                <LinkIcon className="w-4 h-4" />
                                                                <span>Foto Subida</span>
                                                            </a>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    ref={(el) => { fileInputRefs.current[item.id] = el; }}
                                                                    onChange={(e) => {
                                                                        if (e.target.files && e.target.files[0]) {
                                                                            handleLocalPhotoSelect(item.id, e.target.files[0]);
                                                                        }
                                                                    }}
                                                                />
                                                                <button
                                                                    disabled={task.status === 'COMPLETED'}
                                                                    onClick={() => fileInputRefs.current[item.id]?.click()}
                                                                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${task.status === 'COMPLETED' ? 'opacity-50 cursor-not-allowed' :
                                                                        pendingPhoto
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                                            : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20'
                                                                        }`}
                                                                >
                                                                    {pendingPhoto ? (
                                                                        <div className="flex items-center gap-1 text-[10px] font-bold">
                                                                            <ImageIcon className="w-4 h-4" /> Listo
                                                                        </div>
                                                                    ) : (
                                                                        <Camera className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Complete Button */}
                                {task.status !== 'COMPLETED' && (
                                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <button
                                            onClick={() => submitTask(task)}
                                            disabled={completingTaskId === task.id}
                                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            {completingTaskId === task.id ? (
                                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Guardando...</>
                                            ) : (
                                                'Completar Tarea'
                                            )}
                                        </button>
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
