'use client';

import { MapPin, Globe } from 'lucide-react';
import { GeoStats } from '@/modules/analytics/actions/analytics';

interface GeoMapProps {
    data?: GeoStats[];
}

export function GeoMap({ data = [] }: GeoMapProps) {
    const maxUsers = data.length > 0 ? Math.max(...data.map(c => c.sessions)) : 100;
    const countries = data.length > 0 ? data : [
        { country: 'Sin datos', countryCode: 'XX', sessions: 0, percentage: 0, visitors: 0 }
    ];

    // Helper to get flag (mock implementation or use country code to emoji)
    const getFlag = (code: string) => {
        if (!code || code === 'XX') return '🌍';
        // Simple mock for common codes, real app would use a library
        const flags: Record<string, string> = {
            'CO': '🇨🇴', 'US': '🇺🇸', 'MX': '🇲🇽', 'ES': '🇪🇸', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪'
        };
        return flags[code] || '🌍';
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Countries List */}
            <div className="col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-violet-600" />
                    Por País
                </h4>
                <div className="space-y-3">
                    {countries.map((country, index) => (
                        <div key={`${country.countryCode}-${index}`} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getFlag(country.countryCode)}</span>
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                        {country.country}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {country.sessions.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500 w-12 text-right">
                                        {country.percentage}%
                                    </span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${(country.sessions / maxUsers) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cities List - Hidden for now until getCityStats is implemented */}
            {/* 
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Top Ciudades
                </h4>
                 ... 
            </div>
            */}
        </div>
    );
}
