'use client';

import { useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Bell, X, CheckCircle } from 'lucide-react';

const initialAlerts = [
    {
        id: 1,
        type: 'warning',
        title: 'Bounce Rate Elevado',
        message: 'El bounce rate de /contacto subió a 45.2%, un 8% más que el promedio.',
        metric: 'bounce_rate',
        value: 45.2,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
    {
        id: 2,
        type: 'success',
        title: 'Meta de Conversión Alcanzada',
        message: 'La tasa de conversión superó el 3%, objetivo del mes cumplido!',
        metric: 'conversion_rate',
        value: 3.2,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
        id: 3,
        type: 'info',
        title: 'Pico de Tráfico Detectado',
        message: 'Usuarios activos 180% arriba del promedio horario.',
        metric: 'active_users',
        value: 573,
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    },
];

const typeStyles = {
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
    },
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-700',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: TrendingUp,
        iconColor: 'text-blue-500',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
    },
};

function formatTimeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Hace unos segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
}

export function KpiAlerts() {
    const [alerts, setAlerts] = useState(initialAlerts);

    const dismissAlert = (id: number) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    if (alerts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay alertas activas</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-violet-600" />
                    Alertas de KPI
                </h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    {alerts.length} activas
                </span>
            </div>

            {alerts.map((alert) => {
                const style = typeStyles[alert.type as keyof typeof typeStyles];
                const Icon = style.icon;

                return (
                    <div
                        key={alert.id}
                        className={`${style.bg} ${style.border} border rounded-xl p-4 transition-all hover:shadow-md`}
                    >
                        <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                        {alert.title}
                                    </h4>
                                    <button
                                        onClick={() => dismissAlert(alert.id)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`${style.badgeBg} ${style.badgeText} text-xs px-2 py-0.5 rounded-full`}>
                                        {alert.value}%
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {formatTimeAgo(alert.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
