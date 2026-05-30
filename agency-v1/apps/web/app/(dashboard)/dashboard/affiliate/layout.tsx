import Link from 'next/link';
import { usePathname } from 'next/navigation';

// This is a Server Component layout — sub-nav rendered server-side
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

const SUB_NAV = [
    { href: '/dashboard/affiliate',          label: 'Overview',    code: 'OVW' },
    { href: '/dashboard/affiliate/referrals', label: 'Referidos',   code: 'REF' },
    { href: '/dashboard/affiliate/payouts',   label: 'Pagos',       code: 'PAY' },
    { href: '/dashboard/affiliate/plans',     label: 'Planes',      code: 'PLN' },
];

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect('/auth/login');

    return (
        <div className="ds-page space-y-6">
            {/* ── Sub Navigation ── */}
            <div className="flex items-center gap-1 flex-wrap"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.6)', paddingBottom: '0' }}>
                {/* Title */}
                <div className="flex-1 flex items-center gap-3 pb-4">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400">Programa de Afiliados</h1>
                        <p className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">Sistema de referidos y comisiones</p>
                    </div>
                </div>

                {/* Sub-nav tabs */}
                <div className="flex items-center gap-0 pb-0">
                    {SUB_NAV.map(item => (
                        <AffiliateNavLink key={item.href} {...item} />
                    ))}
                </div>
            </div>

            {children}
        </div>
    );
}

// Client component for active tab highlighting
import { AffiliateNavClient } from './nav-client';

function AffiliateNavLink({ href, label, code }: { href: string; label: string; code: string }) {
    return <AffiliateNavClient href={href} label={label} code={code} />;
}
