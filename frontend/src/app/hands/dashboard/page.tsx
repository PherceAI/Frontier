// Hands Dashboard - Worker Interface
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { opsApi, configApi } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EmployeeData {
    id: string;
    fullName: string;
    areas: { id: string; name: string; type: string }[];
}

import { CatalogItem } from '@/types/operations';

export default function HandsDashboard() {
    const [employee, setEmployee] = useState<EmployeeData | null>(null);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
    const [eventType, setEventType] = useState<'DEMAND' | 'SUPPLY'>('DEMAND');
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        const data = Cookies.get('employeeData');
        if (data) {
            const parsed = JSON.parse(data) as EmployeeData;
            setEmployee(parsed);
            if (parsed.areas.length > 0) {
                setSelectedArea(parsed.areas[0].id);
            }
        } else {
            router.push('/hands');
        }
    }, [router]);

    const { data: pending } = useQuery({
        queryKey: ['pending'],
        queryFn: opsApi.getPending,
        enabled: !!employee,
    });

    const { data: items } = useQuery({
        queryKey: ['items'],
        queryFn: opsApi.getCatalog,
        enabled: !!employee,
    });

    const submitMutation = useMutation({
        mutationFn: opsApi.createEvent,
        onSuccess: () => {
            toast.success('¡Registrado!');
            setSelectedItems(new Map());
            queryClient.invalidateQueries({ queryKey: ['pending'] });
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        },
        onError: () => {
            toast.error('Error al enviar');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        },
    });

    const handleQuantityChange = (itemId: string, delta: number) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(itemId) || 0;
            const newValue = Math.max(0, current + delta);
            if (newValue === 0) {
                newMap.delete(itemId);
            } else {
                newMap.set(itemId, newValue);
            }
            return newMap;
        });
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const handleSubmit = () => {
        if (selectedItems.size === 0) {
            toast.error('Selecciona al menos un item');
            return;
        }

        const itemsArray = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
            itemId,
            quantity,
        }));

        submitMutation.mutate({
            areaId: selectedArea,
            eventType,
            items: itemsArray,
        });
    };

    const handleLogout = async () => {
        try {
            await opsApi.getPending(); // Just to trigger logout via API
        } catch {
            // Ignore error
        }
        Cookies.remove('sessionToken');
        Cookies.remove('employeeData');
        router.push('/hands');
    };

    const totalItems = Array.from(selectedItems.values()).reduce((a, b) => a + b, 0);

    if (!employee) return null;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col pb-safe">
            {/* Header */}
            <header className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <p className="text-gray-400 text-sm">Hola,</p>
                    <h1 className="text-xl font-bold text-gray-50">{employee.fullName}</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-200 p-2"
                >
                    Salir
                </button>
            </header>

            {/* Pending Count */}
            {pending && pending.totalPending > 0 && (
                <div className="p-4 bg-amber-900/30 border-b border-amber-800">
                    <p className="text-amber-300 text-sm font-medium">
                        📦 {pending.message}
                    </p>
                </div>
            )}

            {/* Area & Type Selector */}
            <div className="p-4 flex gap-2">
                <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="flex-1 bg-gray-800 text-gray-100 rounded-xl px-4 py-3 text-base"
                >
                    {employee.areas.map((area) => (
                        <option key={area.id} value={area.id}>
                            {area.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setEventType(eventType === 'DEMAND' ? 'SUPPLY' : 'DEMAND')}
                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${eventType === 'DEMAND' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}
                >
                    {eventType === 'DEMAND' ? 'Demanda' : 'Suministro'}
                </button>
            </div>

            {/* Items Grid */}
            <div className="flex-1 p-4 overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items?.map((item: CatalogItem) => {
                        const count = selectedItems.get(item.id) || 0;
                        return (
                            <motion.div
                                key={item.id}
                                className={`bg-gray-800 rounded-2xl p-4 flex flex-col items-center ${count > 0 ? 'ring-2 ring-green-500' : ''
                                    }`}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="text-3xl mb-2">🧺</div>
                                <p className="text-sm text-gray-300 text-center mb-3 line-clamp-2">
                                    {item.name}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.id, -1)}
                                        className="w-10 h-10 bg-gray-700 rounded-xl text-xl font-bold text-gray-300 hover:bg-gray-600"
                                        disabled={count === 0}
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center text-xl font-bold text-gray-100">
                                        {count}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(item.id, 1)}
                                        className="w-10 h-10 bg-gray-700 rounded-xl text-xl font-bold text-gray-300 hover:bg-gray-600"
                                    >
                                        +
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Submit Button */}
            <AnimatePresence>
                {totalItems > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="p-4 border-t border-gray-800"
                    >
                        <button
                            onClick={handleSubmit}
                            disabled={submitMutation.isPending}
                            className={`w-full h-16 rounded-2xl text-xl font-bold text-white transition-colors ${eventType === 'DEMAND' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                                } disabled:opacity-50`}
                        >
                            {submitMutation.isPending
                                ? 'Enviando...'
                                : `${eventType === 'DEMAND' ? 'SOLICITAR' : 'ENVIAR'} (${totalItems} piezas)`}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
