'use client';

import { useMemo } from 'react';
import { Gauge, Zap, Shield, Accessibility, Search, Smartphone } from 'lucide-react';

interface ScoreItemProps {
    label: string;
    score: number;
    icon: React.ElementType;
    color: string;
}

const scores = [
    { label: 'Performance', score: 92, icon: Zap, color: 'emerald' },
    { label: 'SEO', score: 88, icon: Search, color: 'blue' },
    { label: 'Accesibilidad', score: 95, icon: Accessibility, color: 'violet' },
    { label: 'Mejores Prácticas', score: 90, icon: Shield, color: 'amber' },
    { label: 'Mobile', score: 86, icon: Smartphone, color: 'cyan' },
];

const colorMap: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    cyan: '#06b6d4',
};

function CircularProgress({ score, size = 120, strokeWidth = 8, color }: {
    score: number;
    size?: number;
    strokeWidth?: number;
    color: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#10b981'; // green
        if (score >= 70) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color === 'auto' ? getScoreColor(score) : colorMap[color] || color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}</span>
                <span className="text-xs text-gray-500">/ 100</span>
            </div>
        </div>
    );
}

export function PerformanceScore() {
    const overallScore = useMemo(() => {
        return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Main Score */}
            <div className="text-center">
                <CircularProgress score={overallScore} size={160} strokeWidth={12} color="auto" />
                <p className="mt-3 text-sm font-semibold text-gray-700">Puntuación General</p>
                <p className="text-xs text-gray-500">Basado en 5 métricas</p>
            </div>

            {/* Individual Scores */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {scores.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.label}
                            className="text-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <CircularProgress score={item.score} size={70} strokeWidth={5} color={item.color} />
                            <div className="mt-2 flex items-center justify-center gap-1">
                                <Icon className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
