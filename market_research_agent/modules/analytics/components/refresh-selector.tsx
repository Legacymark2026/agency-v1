'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';

const intervals = [
    { label: 'Off', value: 0 },
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
];

interface RefreshSelectorProps {
    onRefresh?: () => void;
}

export function RefreshSelector({ onRefresh }: RefreshSelectorProps) {
    const [selected, setSelected] = useState(0);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        onRefresh?.();

        // Simulate refresh
        await new Promise(resolve => setTimeout(resolve, 500));

        setLastRefresh(new Date());
        setIsRefreshing(false);
    }, [onRefresh]);

    useEffect(() => {
        if (selected === 0) return;

        const interval = setInterval(() => {
            handleRefresh();
        }, selected * 1000);

        return () => clearInterval(interval);
    }, [selected, handleRefresh]);

    const formatLastRefresh = () => {
        if (!lastRefresh) return null;
        return lastRefresh.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="flex items-center gap-3">
            {/* Manual refresh button */}
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Actualizar ahora"
            >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Auto-refresh selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {intervals.map((interval) => (
                    <button
                        key={interval.value}
                        onClick={() => setSelected(interval.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${selected === interval.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {interval.label}
                    </button>
                ))}
            </div>

            {/* Last refresh time */}
            {lastRefresh && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {formatLastRefresh()}
                </span>
            )}
        </div>
    );
}
