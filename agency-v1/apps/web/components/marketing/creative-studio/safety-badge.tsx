'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface SafetyBadgeProps {
    imageUrl: string;
    compact?: boolean;
}

type SafetyStatus = 'idle' | 'scanning' | 'safe' | 'review' | 'rejected';

interface ScanResult {
    safe: boolean;
    score: number;
    flags: string[];
    recommendation: 'APPROVED' | 'REVIEW' | 'REJECTED';
    details: string;
}

export function SafetyBadge({ imageUrl, compact = false }: SafetyBadgeProps) {
    const [status, setStatus] = useState<SafetyStatus>('idle');
    const [result, setResult] = useState<ScanResult | null>(null);

    async function scan() {
        setStatus('scanning');
        try {
            const res = await fetch('/api/creative/safety', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl }),
            });
            const data = await res.json() as ScanResult;
            setResult(data);
            setStatus(data.recommendation === 'APPROVED' ? 'safe' : data.recommendation === 'REVIEW' ? 'review' : 'rejected');
        } catch {
            setStatus('idle');
        }
    }

    if (compact) {
        const icons: Record<SafetyStatus, React.ReactNode> = {
            idle: <button type="button" onClick={scan} title="Escanear seguridad" className="hover:opacity-80"><ShieldCheck className="w-4 h-4 text-gray-500" /></button>,
            scanning: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
            safe: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
            review: <ShieldAlert className="w-4 h-4 text-amber-400" />,
            rejected: <ShieldX className="w-4 h-4 text-red-400" />,
        };
        return <span title={result?.details ?? 'Click para escanear'}>{icons[status]}</span>;
    }

    return (
        <div className="space-y-3">
            {/* Image preview with overlay */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-square max-w-xs">
                <Image src={imageUrl} alt="Asset to scan" fill className="object-cover" unoptimized />
                {status !== 'idle' && (
                    <div className={`absolute inset-0 flex items-center justify-center ${status === 'scanning' ? 'bg-black/40' :
                            status === 'safe' ? 'bg-emerald-500/10' :
                                status === 'review' ? 'bg-amber-500/10' :
                                    'bg-red-500/20'
                        }`}>
                        {status === 'scanning' && <Loader2 className="w-10 h-10 text-white animate-spin" />}
                        {status === 'safe' && <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-lg" />}
                        {status === 'review' && <ShieldAlert className="w-12 h-12 text-amber-400 drop-shadow-lg" />}
                        {status === 'rejected' && <ShieldX className="w-12 h-12 text-red-400 drop-shadow-lg" />}
                    </div>
                )}
            </div>

            {/* Score bar */}
            {result && (
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Safety Score</span>
                        <span className={`text-xs font-bold ${result.score >= 80 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {result.score}/100
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                        <div className={`h-2 rounded-full transition-all ${result.score >= 80 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${result.score}%` }} />
                    </div>
                    <p className="text-xs text-gray-400">{result.details}</p>

                    {result.flags.length > 0 && (
                        <div className="space-y-1">
                            {result.flags.map((flag) => (
                                <div key={flag} className="flex items-center gap-2 text-xs text-amber-400">
                                    <ShieldAlert className="w-3 h-3" /> {flag}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recommendation badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${result.recommendation === 'APPROVED' ? 'bg-emerald-500/15 border border-emerald-500/20' :
                            result.recommendation === 'REVIEW' ? 'bg-amber-500/15 border border-amber-500/20' :
                                'bg-red-500/15 border border-red-500/20'
                        }`}>
                        {result.recommendation === 'APPROVED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                            result.recommendation === 'REVIEW' ? <Clock className="w-4 h-4 text-amber-400" /> :
                                <XCircle className="w-4 h-4 text-red-400" />}
                        <span className={`text-xs font-semibold ${result.recommendation === 'APPROVED' ? 'text-emerald-400' :
                                result.recommendation === 'REVIEW' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                            {result.recommendation === 'APPROVED' ? 'Apto para todas las plataformas' :
                                result.recommendation === 'REVIEW' ? 'Requiere revisión manual' :
                                    'No apto — Rechazado por políticas'}
                        </span>
                    </div>
                </div>
            )}

            <Button id={`safety-scan-${imageUrl.slice(-8)}`} onClick={scan} disabled={status === 'scanning'}
                variant="outline"
                className="w-full border-white/10 text-gray-300 hover:bg-white/5 gap-2 h-9 text-xs">
                {status === 'scanning' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Escaneando...</> :
                    <><ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                        {result ? 'Re-escanear' : 'Escanear Brand Safety'}</>}
            </Button>
        </div>
    );
}
