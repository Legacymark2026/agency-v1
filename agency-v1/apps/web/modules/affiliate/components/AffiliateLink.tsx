'use client';

import { useCopyLink } from '../hooks';
import { Copy, CheckCheck, ExternalLink, Share2 } from 'lucide-react';

interface AffiliateLinkProps {
    code: string;
    baseUrl?: string;
}

export function AffiliateLink({ code, baseUrl }: AffiliateLinkProps) {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com');
    const link = `${base}/r/${code}`;
    const { copied, copy } = useCopyLink(link);

    return (
        <div className="relative group rounded-sm overflow-hidden"
            style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)' }}>

            {/* top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />

            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Share2 size={14} className="text-teal-400" />
                    <span className="font-mono text-xs text-teal-400 uppercase tracking-widest">Tu Link de Afiliado</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 px-4 py-3 rounded-sm font-mono text-sm text-slate-300 truncate"
                        style={{ background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.8)' }}>
                        {link}
                    </div>

                    <button
                        onClick={copy}
                        className="flex items-center gap-2 px-4 py-3 rounded-sm font-mono text-xs font-bold uppercase tracking-widest transition-all duration-200 shrink-0"
                        style={{
                            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(13,148,136,0.15)',
                            border: copied ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(13,148,136,0.4)',
                            color: copied ? '#34d399' : '#2dd4bf',
                        }}
                    >
                        {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : 'Copiar'}
                    </button>

                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-10 h-10 rounded-sm transition-all duration-200"
                        style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(30,41,59,0.8)', color: '#64748b' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>

                <div className="flex items-center gap-4 mt-3">
                    <span className="font-mono text-xs text-slate-600">Código:</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm"
                        style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', color: '#2dd4bf' }}>
                        {code}
                    </span>
                </div>
            </div>
        </div>
    );
}
