'use client';

import { useState } from 'react';
import { MessageSquare, Plus, X, TrendingUp, AlertTriangle, Megaphone, Gift } from 'lucide-react';

interface Annotation {
    id: number;
    date: string;
    title: string;
    description: string;
    type: 'campaign' | 'event' | 'issue' | 'release';
    impact?: number;
}

const initialAnnotations: Annotation[] = [
    {
        id: 1,
        date: '2026-01-15',
        title: 'Lanzamiento Campaña Email',
        description: 'Newsletter de enero enviado a 5,000 suscriptores',
        type: 'campaign',
        impact: 23,
    },
    {
        id: 2,
        date: '2026-01-22',
        title: 'Nueva Versión Landing',
        description: 'Rediseño de la página principal con nuevo CTA',
        type: 'release',
        impact: 15,
    },
    {
        id: 3,
        date: '2026-01-28',
        title: 'Caída del Servidor',
        description: '2 horas de downtime por mantenimiento',
        type: 'issue',
        impact: -18,
    },
    {
        id: 4,
        date: '2026-02-01',
        title: 'Promoción Black Friday',
        description: 'Descuentos del 30% durante el fin de semana',
        type: 'event',
        impact: 45,
    },
];

const typeConfig = {
    campaign: { icon: Megaphone, color: 'violet', label: 'Campaña' },
    event: { icon: Gift, color: 'amber', label: 'Evento' },
    issue: { icon: AlertTriangle, color: 'red', label: 'Incidente' },
    release: { icon: TrendingUp, color: 'emerald', label: 'Release' },
};

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export function AnnotationsTimeline() {
    const [annotations, setAnnotations] = useState(initialAnnotations);
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-violet-600" />
                    Anotaciones y Eventos
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                >
                    <Plus className="h-3 w-3" />
                    Añadir
                </button>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Items */}
                <div className="space-y-4">
                    {annotations.map((annotation) => {
                        const config = typeConfig[annotation.type];
                        const colors = colorMap[config.color];
                        const Icon = config.icon;

                        return (
                            <div key={annotation.id} className="relative pl-8">
                                {/* Dot */}
                                <div className={`absolute left-1.5 top-2 w-3 h-3 rounded-full ${colors.dot} ring-2 ring-white`} />

                                {/* Card */}
                                <div className={`${colors.bg} ${colors.border} border rounded-lg p-3 hover:shadow-md transition-all`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            <Icon className={`h-4 w-4 ${colors.text} mt-0.5`} />
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm">{annotation.title}</h4>
                                                <p className="text-xs text-gray-600 mt-0.5">{annotation.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-500">{annotation.date}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {annotation.impact && (
                                            <span className={`text-xs font-semibold ${annotation.impact > 0 ? 'text-emerald-600' : 'text-red-500'
                                                }`}>
                                                {annotation.impact > 0 ? '+' : ''}{annotation.impact}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
