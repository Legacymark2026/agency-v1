'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface Visitor {
    id: number;
    x: number;
    y: number;
    country: string;
    city: string;
    opacity: number;
}

interface LiveVisitorsMapProps {
    initialCount?: number;
}

const countries = [
    { name: 'Colombia', x: 28, y: 55 },
    { name: 'México', x: 18, y: 42 },
    { name: 'Estados Unidos', x: 22, y: 35 },
    { name: 'España', x: 48, y: 32 },
    { name: 'Argentina', x: 32, y: 78 },
    { name: 'Brasil', x: 38, y: 62 },
    { name: 'Chile', x: 28, y: 75 },
    { name: 'Perú', x: 25, y: 60 },
];

export function LiveVisitorsMap({ initialCount = 0 }: LiveVisitorsMapProps) {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [totalLive, setTotalLive] = useState(initialCount);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Add initial visitors
            const initial = countries.slice(0, 5).map((c, i) => ({
                id: i,
                x: c.x + (Math.random() * 6 - 3),
                y: c.y + (Math.random() * 6 - 3),
                country: c.name,
                city: 'Ciudad',
                opacity: 1,
            }));
            setVisitors(initial);

            // Update total live if initial count provided
            if (initialCount > 0) {
                setTotalLive(initialCount);
            }
        }, 0);

        // Simulate new visitors appearing
        const interval = setInterval(() => {
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            const newVisitor: Visitor = {
                id: Date.now(),
                x: randomCountry.x + (Math.random() * 6 - 3),
                y: randomCountry.y + (Math.random() * 6 - 3),
                country: randomCountry.name,
                city: 'Ciudad',
                opacity: 1,
            };

            setVisitors(prev => {
                const updated = [...prev, newVisitor].slice(-15); // Keep max 15 dots
                return updated;
            });

            // Simulate slight fluctuation around specific value or just random if 0
            setTotalLive(prev => {
                const fluctuation = Math.floor(Math.random() * 3) - 1;
                return Math.max(initialCount || 1, prev + fluctuation);
            });
        }, 2000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [initialCount]);

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-violet-600" />
                    Visitantes en Vivo
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">{totalLive} en línea</span>
                </div>
            </div>

            {/* World Map (simplified) */}
            <div className="relative w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden">
                {/* World map background */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
                    <ellipse cx="50" cy="50" rx="45" ry="40" fill="none" stroke="#64748b" strokeWidth="0.5" />
                    <ellipse cx="50" cy="50" rx="30" ry="40" fill="none" stroke="#64748b" strokeWidth="0.3" />
                    <ellipse cx="50" cy="50" rx="15" ry="40" fill="none" stroke="#64748b" strokeWidth="0.3" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="#64748b" strokeWidth="0.3" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke="#64748b" strokeWidth="0.3" />
                </svg>

                {/* Visitor dots */}
                {visitors.map((visitor) => (
                    <div
                        key={visitor.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        style={{
                            left: `${visitor.x}%`,
                            top: `${visitor.y}%`,
                        }}
                    >
                        {/* Pulse ring */}
                        <span className="absolute inline-flex h-4 w-4 rounded-full bg-violet-400 opacity-50 animate-ping" />
                        {/* Dot */}
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg" />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {visitor.country}
                        </div>
                    </div>
                ))}

                {/* Legend */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1 bg-white/80 rounded-lg text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                    <span>Visitante activo</span>
                </div>
            </div>
        </div>
    );
}
