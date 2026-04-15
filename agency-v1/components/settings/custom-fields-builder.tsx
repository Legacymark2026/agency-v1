"use client";

import { ListPlus, LayoutTemplate, Settings2, GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { updateCustomFields } from "@/app/actions/crm-settings";

export function CustomFieldsBuilder({ initialData }: { initialData?: any[] }) {
    const [fields, setFields] = useState<any[]>(initialData || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Guardando esquema de datos...");

        const result = await updateCustomFields(fields);

        if (result.success) {
            toast.success("Campos personalizados actualizados en la base de datos.", { id: toastId });
        } else {
            toast.error(result.error || "Ocurrió un error al guardar", { id: toastId });
        }
        setIsSaving(false);
    };

    const handleDelete = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        toast.success("Campo eliminado temporalmente", {
            description: "Asegúrate de guardar los cambios para aplicar."
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600 shrink-0">
                        <ListPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Campos Personalizados (CRM)</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Diseña el formulario de información que tu equipo deberá llenar al registrar un nuevo Lead o Proyecto.
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings2 className="w-4 h-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Esquema"}
                </Button>
            </div>

            <div className="p-6 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-700 text-sm">Estructura Actual</h4>
                    <Button variant="outline" size="sm" className="bg-white" onClick={() => {
                        setFields([...fields, { id: `new_${Date.now()}`, name: "Nuevo Campo", type: "Texto", required: false }]);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Campo
                    </Button>
                </div>

                <div className="space-y-3">
                    {fields.map((field) => (
                        <div key={field.id} className="group flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                            <GripVertical className="w-5 h-5 text-slate-300 cursor-grab hover:text-slate-500 shrink-0" />

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                <div>
                                    <span className="text-xs text-slate-500 block mb-0.5">Nombre del Campo</span>
                                    <span className="font-semibold text-slate-900">{field.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block mb-0.5">Tipo de Dato</span>
                                    <span className="text-sm text-slate-700 flex items-center gap-1.5">
                                        <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
                                        {field.type}
                                    </span>
                                </div>
                                <div className="flex items-center sm:justify-end gap-2">
                                    {field.required && (
                                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Requerido</span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(field.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                            No hay campos personalizados configurados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
