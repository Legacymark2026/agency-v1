'use client';

import { useEffect, useState } from 'react';
import { Activity, Circle } from 'lucide-react';

interface RealtimeIndicatorProps {
    count?: number;
}

export function RealtimeIndicator({ count = 47 }: RealtimeIndicatorProps) {
    const [users, setUsers] = useState(count);

    // Simulate real-time updates for liveness feeling
    useEffect(() => {
        const timer = setTimeout(() => setUsers(count), 0);

        const interval = setInterval(() => {
            setUsers(prev => {
                const change = Math.floor(Math.random() * 5) - 2; // Subtle fluctuation
                return Math.max(0, prev + change);
            });
        }, 4000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [count]);

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <div className="relative">
                <Circle className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                <span className="absolute inset-0 animate-ping">
                    <Circle className="h-3 w-3 text-emerald-500 fill-emerald-400 opacity-75" />
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                    {users.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600">
                    usuarios activos ahora
                </span>
            </div>
        </div>
    );
}
