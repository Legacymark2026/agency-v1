"use client";

import { Mail, Plus, Edit2, Trash2, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_TEMPLATES = [
    {
        id: "tpl1",
        name: "Bienvenida a Nuevos Leads",
        subject: "¡Hola! Gracias por tu interés en LegacyMark",
        type: "CRM",
        lastEdited: "hace 2 días",
    },
    {
        id: "tpl2",
        name: "Seguimiento Poscotización",
        subject: "Seguimiento a nuestra propuesta - LegacyMark",
        type: "Ventas",
        lastEdited: "hace 1 semana",
    },
    {
        id: "tpl3",
        name: "Invitación a Webinar",
        subject: "Te invitamos a nuestra próxima clase maestra",
        type: "Marketing",
        lastEdited: "hace 1 mes",
    },
];

export function GlobalEmailTemplates() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-violet-100 text-violet-600 shrink-0">
                        <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Plantillas Globales de Email</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-lg">
                            Crea y administra plantillas de correo electrónico que todo tu equipo pueda utilizar de manera estandarizada.
                        </p>
                    </div>
                </div>
                <Button className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Plantilla
                </Button>
            </div>

            <div className="divide-y divide-slate-100">
                {MOCK_TEMPLATES.map((template) => (
                    <div key={template.id} className="p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-slate-900">{template.name}</span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {template.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                <Mail className="w-3.5 h-3.5" />
                                <span className="truncate max-w-sm"><strong>Asunto:</strong> {template.subject}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Editada {template.lastEdited}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-400 border border-transparent hover:border-red-200 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            {MOCK_TEMPLATES.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    <LayoutTemplate className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No tienes plantillas configuradas todavía.</p>
                </div>
            )}
        </div>
    );
}
