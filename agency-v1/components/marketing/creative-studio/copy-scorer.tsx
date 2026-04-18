'use client';

import { useState } from 'react';
import { Loader2, Sparkles, ChevronUp, ChevronDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScoreResult {
    overall: number;
    clarity: number;
    urgency: number;
    benefit: number;
    culturalFit: number;
    feedback: string;
    suggestions: string[];
}

interface CopyScorerProps {
    copy: Record<string, string>;
    platform: string;
}

const SCORE_COLOR = (s: number) => s >= 8 ? 'text-emerald-400' : s >= 6 ? 'text-yellow-400' : 'text-red-400';
const SCORE_BG = (s: number) => s >= 8 ? 'bg-emerald-500' : s >= 6 ? 'bg-yellow-500' : 'bg-red-500';

export function CopyScorer({ copy, platform }: CopyScorerProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function score() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/creative/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ copy, platform }),
            });
            const data = await res.json() as ScoreResult & { error?: string };
            if (data.error) throw new Error(data.error);
            setResult(data);
            setExpanded(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al evaluar');
        } finally {
            setLoading(false);
        }
    }

    const DIMENSIONS = [
        { key: 'clarity' as const, label: 'Claridad' },
        { key: 'urgency' as const, label: 'Urgencia' },
        { key: 'benefit' as const, label: 'Beneficio' },
        { key: 'culturalFit' as const, label: 'Fit Cultural' },
    ];

    return (
        <div className="space-y-3">
            <Button id="score-copy-btn" onClick={score} disabled={loading || Object.keys(copy).length === 0}
                variant="outline"
                className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-2 h-10">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analizando con IA...</> : <><Sparkles className="w-4 h-4" />Evaluar Copy con IA</>}
            </Button>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            {result && (
                <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                    {/* Header */}
                    <button type="button" onClick={() => setExpanded((e) => !e)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15" fill="none"
                                        stroke={result.overall >= 8 ? '#10B981' : result.overall >= 6 ? '#F59E0B' : '#EF4444'}
                                        strokeWidth="3" strokeDasharray={`${(result.overall / 10) * 94.2} 94.2`} strokeLinecap="round" />
                                </svg>
                                <span className={cn('absolute inset-0 flex items-center justify-center text-sm font-bold', SCORE_COLOR(result.overall))}>
                                    {result.overall.toFixed(1)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Score de Copy</p>
                                <p className="text-xs text-gray-500">
                                    {result.overall >= 8 ? '✨ Excelente' : result.overall >= 6 ? '👍 Bueno' : '⚠️ Necesita mejoras'}
                                </p>
                            </div>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>

                    {expanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">
                            {/* Dimension bars */}
                            <div className="space-y-2.5">
                                {DIMENSIONS.map(({ key, label }) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-gray-400">{label}</span>
                                            <span className={cn('text-xs font-bold', SCORE_COLOR(result[key]))}>{result[key]}/10</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/5">
                                            <div className={cn('h-1.5 rounded-full transition-all', SCORE_BG(result[key]))}
                                                style={{ width: `${(result[key] / 10) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Feedback */}
                            <p className="text-xs text-gray-300 leading-relaxed italic">"{result.feedback}"</p>

                            {/* Suggestions */}
                            {result.suggestions.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3" /> Sugerencias de Mejora
                                    </p>
                                    {result.suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                                            <span className="text-violet-400 shrink-0">{i + 1}.</span> {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
