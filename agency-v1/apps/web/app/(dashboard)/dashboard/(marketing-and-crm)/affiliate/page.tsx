import { getAffiliateStats } from '@/modules/affiliate/actions';
import { AffiliateDashboard } from '@/modules/affiliate/components';
import { AffiliateLink } from '@/modules/affiliate/components';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { Sparkles, AlertTriangle, Link2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Programa de Afiliados | Dashboard',
    description: 'Monitorea tus referidos, comisiones y pagos en tiempo real.',
};

export const dynamic = 'force-dynamic';

export default async function AffiliateOverviewPage() {
    const result = await getAffiliateStats();
    const stats = result.data;

    return (
        <div className="space-y-6">
            {/* ── Header Card ── */}
            <InteractiveSpotlight className="relative ds-card">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                <div className="absolute top-0 right-0 w-72 h-48 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top right,rgba(13,148,136,0.07),transparent 70%)' }} />
                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[AFF · OVW]</div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                    <div>
                        <div className="mb-3">
                            <span className="ds-badge ds-badge-teal">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                                </span>
                                <Sparkles size={8} /> Programa de Afiliados · Live
                            </span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-white">
                            Panel de{' '}
                            <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                                Afiliados
                            </span>
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">Referidos, comisiones y pagos en tiempo real.</p>
                    </div>

                    {stats?.profile && (
                        <div className="shrink-0">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest"
                                style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}>
                                <Link2 size={12} />
                                Código: <strong>{stats.profile.code}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </InteractiveSpotlight>

            {/* ── No profile yet ── */}
            {!stats?.profile && (
                <div className="rounded-sm p-8 flex flex-col items-center text-center space-y-4"
                    style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <AlertTriangle size={28} className="text-amber-400" />
                    <div>
                        <p className="font-bold text-amber-300 mb-1">No tienes perfil de afiliado</p>
                        <p className="font-mono text-xs text-slate-500">Contacta al administrador para activar tu cuenta de afiliado.</p>
                    </div>
                </div>
            )}

            {/* ── Affiliate link ── */}
            {stats?.profile && (
                <AffiliateLink code={stats.profile.code} />
            )}

            {/* ── KPI Dashboard ── */}
            {stats && <AffiliateDashboard stats={stats} />}

            {/* ── Quick links ── */}
            {stats?.profile && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { href: '/dashboard/affiliate/referrals', label: 'Ver todos los referidos', count: stats.totalReferrals, color: 'amber' },
                        { href: '/dashboard/affiliate/payouts',   label: 'Historial de pagos',      count: null,                color: 'violet' },
                        { href: '/dashboard/affiliate/plans',     label: 'Planes de comisión',      count: null,                color: 'teal' },
                    ].map(({ href, label, count, color }) => {
                        const colors: Record<string, any> = {
                            amber:  { border: 'rgba(245,158,11,0.25)',  bg: 'rgba(245,158,11,0.06)',  text: '#fbbf24' },
                            violet: { border: 'rgba(139,92,246,0.25)',  bg: 'rgba(139,92,246,0.06)',  text: '#a78bfa' },
                            teal:   { border: 'rgba(13,148,136,0.25)',  bg: 'rgba(13,148,136,0.06)',  text: '#2dd4bf' },
                        };
                        const c = colors[color];
                        return (
                            <Link key={href} href={href}
                                className="flex items-center justify-between px-5 py-4 rounded-sm transition-all hover:scale-[1.01]"
                                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: c.text }}>{label}</span>
                                {count !== null && (
                                    <span className="font-black text-lg text-white">{count}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
