'use client';

import { useState } from 'react';
import { X, Save, AlignLeft, Tags, Send, AlertCircle, CalendarClock, Link2 } from 'lucide-react';
import { createInboxMacro, updateInboxMacro, InboxMacroActionType } from '@/actions/inbox-macros';
import toast from 'react-hot-toast';

export function MacroFormModal({ companyId, editingMacro, onClose, onSuccess }: any) {
    const [isSaving, setIsSaving] = useState(false);
    
    // Default form values
    const [formData, setFormData] = useState({
        title: editingMacro?.title || '',
        description: editingMacro?.description || '',
        color: editingMacro?.color || '#10b981',
        actionType: (editingMacro?.actionType as InboxMacroActionType) || 'TEXT_REPLY',
        textTemplate: editingMacro?.payload?.textTemplate || '',
        tagsToAdd: editingMacro?.payload?.tagsToAdd?.join(', ') || '',
        assignToId: editingMacro?.payload?.assignToId || '',
        webhookUrl: editingMacro?.payload?.webhookUrl || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.actionType) {
            toast.error('Revisa los campos obligatorios');
            return;
        }

        setIsSaving(true);

        const payload: any = {};
        if (formData.actionType === 'TEXT_REPLY') payload.textTemplate = formData.textTemplate;
        if (formData.actionType === 'ASSIGN_TAG') payload.tagsToAdd = formData.tagsToAdd.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (formData.actionType === 'ESCALATE') payload.assignToId = formData.assignToId;
        if (formData.actionType === 'WEBHOOK') payload.webhookUrl = formData.webhookUrl;

        let res;
        if (editingMacro) {
            res = await updateInboxMacro(editingMacro.id, {
                title: formData.title,
                description: formData.description,
                color: formData.color,
                actionType: formData.actionType,
                payload
            });
        } else {
            res = await createInboxMacro({
                companyId,
                title: formData.title,
                description: formData.description,
                color: formData.color,
                actionType: formData.actionType,
                payload
            });
        }

        setIsSaving(false);

        if (res.success && res.data) {
            toast.success(`Macro ${editingMacro ? 'actualizada' : 'creada'} correctamente`);
            onSuccess(res.data);
        } else {
            toast.error(res.error || 'Ocurrió un error guardando la macro');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f1115] border border-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/40">
                    <h3 className="font-semibold text-lg text-slate-100">
                        {editingMacro ? 'Editar Macro' : 'Crear Nueva Macro'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <form id="macro-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Nombre de la Macro <span className="text-teal-500">*</span>
                                </label>
                                <input 
                                    autoFocus
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-100"
                                    placeholder="Ej: Pedir Pago, Agendar Cita"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                    Breve Descripción
                                </label>
                                <input 
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 text-sm border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-300"
                                    placeholder="Explícale a tu equipo qué hace esta macro..."
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Tipo de Acción <span className="text-teal-500">*</span>
                                    </label>
                                    <select 
                                        name="actionType"
                                        value={formData.actionType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-200"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="TEXT_REPLY" className="bg-slate-900">Enviar plantilla de texto rápida</option>
                                        <option value="ASSIGN_TAG" className="bg-slate-900">Aplicar múltiples etiquetas al Lead</option>
                                        <option value="ESCALATE" className="bg-slate-900">Escalar/Transferir caso a agente</option>
                                        <option value="SEND_PAYMENT_LINK" className="bg-slate-900">Generar y enviar enlace PayU de la última factura</option>
                                        <option value="WEBHOOK" className="bg-slate-900">Llamar a un Webhook externo personalizado</option>
                                    </select>
                                </div>
                                
                                <div className="w-24">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Color ID
                                    </label>
                                    <input 
                                        type="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        className="w-full h-9 p-1 border border-slate-800 bg-slate-900/50 outline-none rounded-xl cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CONFIGURACIONES AVANZADAS SEGÚN EL ACTION TYPE */}
                        <div className="pt-6 border-t border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                Configuración Avanzada del Botón
                            </h4>

                            {formData.actionType === 'TEXT_REPLY' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-medium text-slate-300">Mensaje a Enviar</label>
                                    <textarea 
                                        name="textTemplate"
                                        value={formData.textTemplate}
                                        onChange={handleChange}
                                        className="w-full p-4 text-sm border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all h-32 text-slate-200 font-mono"
                                        placeholder="Escribe el mensaje exacto que se enviará automáticamente..."
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <p className="text-xs text-slate-500 font-mono">
                                        Variables beta: Puedes usar {"{{lead.name}}"} en futuras actualizaciones.
                                    </p>
                                </div>
                            )}

                            {formData.actionType === 'ASSIGN_TAG' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-medium text-slate-300">Etiquetas (separadas por coma)</label>
                                    <input 
                                        name="tagsToAdd"
                                        value={formData.tagsToAdd}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-200 font-mono"
                                        placeholder="VIP, Urgente, Interesado..."
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <p className="text-xs text-slate-500 font-mono">
                                        Al oprimir la macro, estas etiquetas se sumarán automáticamente al prospecto actual.
                                    </p>
                                </div>
                            )}

                            {formData.actionType === 'ESCALATE' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-medium text-slate-300">ID del Agente Destino</label>
                                    <input 
                                        name="assignToId"
                                        value={formData.assignToId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-200 font-mono"
                                        placeholder="Ej: user_abc123"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <p className="text-xs text-slate-500 font-mono">
                                        Pega el User ID interno al que se transferirá el caso. Pronto añadiremos un selector visual.
                                    </p>
                                </div>
                            )}

                            {formData.actionType === 'WEBHOOK' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <label className="block text-sm font-medium text-slate-300">URL del Webhook</label>
                                    <input 
                                        name="webhookUrl"
                                        type="url"
                                        value={formData.webhookUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-800 rounded-xl bg-slate-900/50 focus:bg-[#0f1115] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-slate-200 font-mono"
                                        placeholder="https://hook.make.com/..."
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <p className="text-xs text-slate-500 font-mono">
                                        Se enviará un POST a esta URL con los metadatos de la conversación. (Ej. para disparar flujos de Make/Zapier).
                                    </p>
                                </div>
                            )}

                            {formData.actionType === 'SEND_PAYMENT_LINK' && (
                                <div className="p-4 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 text-sm animate-in fade-in slide-in-from-bottom-2">
                                    <p className="font-semibold mb-1 text-teal-300">Acción Inteligente Vinculada</p>
                                    <p className="opacity-90 font-mono text-xs">
                                        Esta macro buscará la factura (Invoice) más reciente asociada a este contacto y enviará por chat el enlace directo de <strong>PayU WebCheckout</strong>.
                                    </p>
                                </div>
                            )}

                        </div>

                    </form>
                </div>

                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="macro-form"
                        className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-white text-slate-900 text-sm font-bold rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {editingMacro ? 'Guardar Cambios' : 'Crear Macro'}
                    </button>
                </div>

            </div>
        </div>
    );
}
