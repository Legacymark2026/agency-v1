'use client';

import { Zap, Gauge, MousePointer, LayoutGrid } from 'lucide-react';
import { PageSpeedData } from '@/modules/analytics/actions/analytics';

interface PageSpeedMetricsProps {
    data?: PageSpeedData;
}

const statusColors = {
    good: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', label: 'Bueno' },
    'needs-improvement': { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', label: 'Mejorable' },
    poor: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', label: 'Pobre' },
};

const getStatus = (label: string, value: number) => {
    const thresholds: any = {
        LCP: { good: 2.5, poor: 4 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        TTFB: { good: 200, poor: 600 },
    };
    const t = thresholds[label];
    if (!t) return 'good';
    if (value <= t.good) return 'good';
    if (value <= t.poor) return 'needs-improvement';
    return 'poor';
};

const getProgress = (label: string, value: number) => {
    const thresholds: any = {
        LCP: { good: 2.5, poor: 4 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        TTFB: { good: 200, poor: 600 },
    };

    const t = thresholds[label];
    if (!t) return 50;

    if (value <= t.good) {
        return (value / t.good) * 33;
    } else if (value <= t.poor) {
        return 33 + ((value - t.good) / (t.poor - t.good)) * 33;
    } else {
        return Math.min(100, 66 + ((value - t.poor) / t.poor) * 34);
    }
};

export function PageSpeedMetrics({ data }: PageSpeedMetricsProps) {
    const overallScore = data?.score || 100;

    const metrics = [
        {
            label: 'LCP',
            value: data?.lcp || 0,
            unit: 's',
            description: 'Largest Contentful Paint',
            icon: LayoutGrid,
        },
        {
            label: 'FID',
            value: data?.fid || 0,
            unit: 'ms',
            description: 'First Input Delay',
            icon: MousePointer,
        },
        {
            label: 'CLS',
            value: data?.cls || 0,
            unit: '',
            description: 'Cumulative Layout Shift',
            icon: LayoutGrid,
        },
        {
            label: 'TTFB',
            value: data?.ttfb || 0,
            unit: 'ms',
            description: 'Time to First Byte',
            icon: Zap,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-violet-600" />
                    Core Web Vitals (Real)
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${overallScore >= 90 ? 'bg-emerald-100 text-emerald-700' :
                    overallScore >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    Score: {overallScore}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {metrics.map((metric) => {
                    const status = getStatus(metric.label, metric.value) as keyof typeof statusColors;
                    const colors = statusColors[status];
                    const Icon = metric.icon;
                    const progress = getProgress(metric.label, metric.value);

                    return (
                        <div key={metric.label} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-gray-500" />
                                        <span className="font-bold text-gray-900">{metric.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{metric.description}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                    {colors.label}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                                <span className="text-sm text-gray-500">{metric.unit}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full flex">
                                    <div className="h-full bg-emerald-500" style={{ width: '33%' }} />
                                    <div className="h-full bg-amber-500" style={{ width: '33%' }} />
                                    <div className="h-full bg-red-500" style={{ width: '34%' }} />
                                </div>
                            </div>
                            <div
                                className="w-2 h-2 bg-gray-900 rounded-full -mt-2 transition-all duration-500"
                                style={{ marginLeft: `calc(${progress}% - 4px)` }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
