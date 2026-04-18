'use client';

import { useState } from 'react';
import { Calendar, Clock, Mail, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const frequencies = [
    { label: 'Diario', value: 'daily' },
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
];

const reportTypes = [
    { label: 'Resumen General', value: 'summary', checked: true },
    { label: 'Tráfico Detallado', value: 'traffic', checked: true },
    { label: 'Conversiones', value: 'conversions', checked: false },
    { label: 'SEO Performance', value: 'seo', checked: false },
];

export function ScheduleDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [frequency, setFrequency] = useState('weekly');
    const [reports, setReports] = useState(reportTypes);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);

    const handleSubmit = async () => {
        if (!email) return;

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsScheduled(true);

        setTimeout(() => {
            setIsOpen(false);
            setIsScheduled(false);
        }, 2000);
    };

    const toggleReport = (value: string) => {
        setReports(prev => prev.map(r =>
            r.value === value ? { ...r, checked: !r.checked } : r
        ));
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Programar</span>
            </Button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-6 w-6" />
                                <h2 className="text-lg font-semibold">Programar Reportes</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-violet-100 text-sm mt-1">
                            Recibe reportes automáticos en tu correo
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="h-4 w-4 inline mr-2" />
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="h-4 w-4 inline mr-2" />
                                Frecuencia
                            </label>
                            <div className="flex gap-2">
                                {frequencies.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFrequency(f.value)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${frequency === f.value
                                                ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                                                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Report types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Incluir en el reporte
                            </label>
                            <div className="space-y-2">
                                {reports.map(report => (
                                    <label
                                        key={report.value}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={report.checked}
                                            onChange={() => toggleReport(report.value)}
                                            className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                                        />
                                        <span className="text-sm text-gray-700">{report.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5">
                        <Button
                            onClick={handleSubmit}
                            disabled={!email || isSubmitting || isScheduled}
                            className={`w-full py-3 rounded-xl font-medium transition-all ${isScheduled
                                    ? 'bg-emerald-500 hover:bg-emerald-500'
                                    : 'bg-violet-600 hover:bg-violet-700'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : isScheduled ? (
                                '✓ Programado!'
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Programar Envío
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
