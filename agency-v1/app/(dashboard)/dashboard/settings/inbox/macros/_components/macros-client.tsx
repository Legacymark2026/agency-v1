'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Wand2, Plus, GripVertical, MoreVertical, Edit2, Trash2, 
    MessageSquareDashed, UserPlus, Tag, Link2, BellRing
} from 'lucide-react';
import { InboxMacroActionType, deleteInboxMacro, toggleInboxMacro } from '@/actions/inbox-macros';
import { MacroFormModal } from './macro-form-modal';
import toast from 'react-hot-toast';

export const ACTION_TYPES: { [key in InboxMacroActionType]: { label: string, icon: any } } = {
    TEXT_REPLY: { label: 'Respuesta de Texto', icon: MessageSquareDashed },
    ASSIGN_TAG: { label: 'Asignar Etiqueta', icon: Tag },
    ESCALATE: { label: 'Escalar Caso', icon: UserPlus },
    SEND_PAYMENT_LINK: { label: 'Enviar Link de Pago', icon: Link2 },
    WEBHOOK: { label: 'Llamar Webhook', icon: BellRing }
};

interface MacrosClientProps {
    initialMacros: any[];
    companyId: string;
}

export function MacrosClient({ initialMacros, companyId }: MacrosClientProps) {
    const router = useRouter();
    const [macros, setMacros] = useState(initialMacros);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMacro, setEditingMacro] = useState<any | null>(null);

    const handleCreate = () => {
        setEditingMacro(null);
        setIsFormOpen(true);
    };

    const handleEdit = (macro: any) => {
        setEditingMacro(macro);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta macro? No se puede deshacer.')) return;
        
        toast.promise(deleteInboxMacro(id), {
            loading: 'Eliminando macro...',
            success: (res) => {
                if (res.success) {
                    setMacros(prev => prev.filter(m => m.id !== id));
                    return 'Macro eliminada correctamente';
                }
                throw new Error(res.error);
            },
            error: (err) => `Error: ${err.message}`
        });
    };

    const handleToggle = async (macro: any) => {
        const newStatus = !macro.isActive;
        const previousStatus = macro.isActive;
        
        // Optimistic UI
        setMacros(prev => prev.map(m => m.id === macro.id ? { ...m, isActive: newStatus } : m));

        const res = await toggleInboxMacro(macro.id, newStatus);
        if (!res.success) {
            toast.error(res.error || 'Error al cambiar estado');
            setMacros(prev => prev.map(m => m.id === macro.id ? { ...m, isActive: previousStatus } : m));
        }
    };

    const onFormSuccess = (savedMacro: any) => {
        if (editingMacro) {
            setMacros(prev => prev.map(m => m.id === savedMacro.id ? savedMacro : m));
        } else {
            setMacros(prev => [savedMacro, ...prev]);
        }
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <h3 className="text-sm font-semibold text-slate-200">Botones de Acción</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                        Ordena y configura los botones que aparecerán en el Inbox según el tipo de acción.
                    </p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold rounded-xl hover:bg-teal-500/20 transition-all font-mono"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Macro
                </button>
            </div>

            {macros.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                    <Wand2 className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                    <h4 className="text-slate-300 font-medium text-sm">No hay macros configuradas</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto font-mono">
                        Crea tu primera macro para acelerar el tiempo de respuesta y estandarizar acciones en el Inbox.
                    </p>
                    <button 
                        onClick={handleCreate}
                        className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-lg font-mono transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Crear mi primera Macro
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {macros.map(macro => {
                        const ActionIcon = ACTION_TYPES[macro.actionType as InboxMacroActionType]?.icon || Wand2;
                        return (
                            <div 
                                key={macro.id}
                                className={`group flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border transition-all ${macro.isActive ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60' : 'border-slate-800/50 opacity-50'}`}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="cursor-grab text-slate-600 hover:text-slate-400 active:cursor-grabbing">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div 
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5"
                                        style={{ backgroundColor: `${macro.color}15`, color: macro.color }}
                                    >
                                        <ActionIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-slate-200 text-sm truncate">{macro.title}</h4>
                                            {!macro.isActive && (
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700 text-slate-400 bg-slate-800">
                                                    Inactiva
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                                            {macro.description || ACTION_TYPES[macro.actionType as InboxMacroActionType]?.label || 'Acción de chat'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 pl-4 ml-4 border-l border-slate-800">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={macro.isActive}
                                            onChange={() => handleToggle(macro)}
                                        />
                                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                                    </label>
                                    
                                    <div className="flex items-center">
                                        <button 
                                            onClick={() => handleEdit(macro)}
                                            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Editar Macro"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(macro.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Eliminar Macro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isFormOpen && (
                <MacroFormModal 
                    companyId={companyId}
                    editingMacro={editingMacro}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={onFormSuccess}
                />
            )}
        </div>
    );
}
