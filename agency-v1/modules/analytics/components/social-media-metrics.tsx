'use client';

import { Facebook, Instagram, Twitter, Linkedin, Youtube, TrendingUp, TrendingDown, Users } from 'lucide-react';

import { SocialMetric as SocialMetricData } from '@/modules/analytics/actions/analytics';

interface SocialMetricUI {
    platform: string;
    icon: React.ElementType;
    color: string;
    followers: number;
    engagement: number;
    reach: number;
    change: number;
}

const metrics: SocialMetricUI[] = [
    { platform: 'Instagram', icon: Instagram, color: '#E4405F', followers: 12450, engagement: 4.8, reach: 45600, change: 12.5 },
    { platform: 'Facebook', icon: Facebook, color: '#1877F2', followers: 8920, engagement: 2.1, reach: 28400, change: 3.2 },
    { platform: 'LinkedIn', icon: Linkedin, color: '#0A66C2', followers: 4560, engagement: 6.2, reach: 12800, change: 18.7 },
    { platform: 'Twitter', icon: Twitter, color: '#1DA1F2', followers: 3280, engagement: 1.8, reach: 8900, change: -2.4 },
    { platform: 'YouTube', icon: Youtube, color: '#FF0000', followers: 2150, engagement: 8.4, reach: 34200, change: 25.3 },
];

interface SocialMediaMetricsProps {
    data?: SocialMetricData[];
}

export function SocialMediaMetrics({ data = [] }: SocialMediaMetricsProps) {
    // Merge real data with icon config
    const displayData = data.length > 0 ? data.map(d => {
        const config = metrics.find(measured => measured.platform === d.platform);
        return {
            ...d,
            icon: config?.icon || Users,
            color: config?.color || '#666'
        };
    }) : metrics;

    const totalFollowers = displayData.reduce((sum, m) => sum + m.followers, 0);
    const avgEngagement = (displayData.reduce((sum, m) => sum + m.engagement, 0) / displayData.length).toFixed(1);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600" />
                    Métricas de Redes Sociales
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">
                        Total: <span className="font-bold text-gray-900">{totalFollowers.toLocaleString()}</span>
                    </span>
                    <span className="text-gray-500">
                        Eng: <span className="font-bold text-violet-600">{avgEngagement}%</span>
                    </span>
                </div>
            </div>

            <div className="space-y-3">
                {displayData.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <div
                            key={metric.platform}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                            {/* Icon */}
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${metric.color}15` }}
                            >
                                <Icon className="h-5 w-5" style={{ color: metric.color }} />
                            </div>

                            {/* Platform Name */}
                            <div className="w-20">
                                <p className="font-medium text-gray-900 text-sm">{metric.platform}</p>
                                <div className={`flex items-center gap-0.5 text-xs ${metric.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                                    }`}>
                                    {metric.change >= 0 ? (
                                        <TrendingUp className="h-3 w-3" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(metric.change)}%
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Seguidores</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {metric.followers >= 1000
                                            ? `${(metric.followers / 1000).toFixed(1)}K`
                                            : metric.followers}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Engagement</p>
                                    <p className="text-sm font-bold text-gray-900">{metric.engagement}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Alcance</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {metric.reach >= 1000
                                            ? `${(metric.reach / 1000).toFixed(1)}K`
                                            : metric.reach}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
