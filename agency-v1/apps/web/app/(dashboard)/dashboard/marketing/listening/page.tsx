import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Ear } from 'lucide-react';
import { SocialListeningDashboard } from '@/components/marketing/social-listening-dashboard';

export const metadata: Metadata = {
    title: 'Social Listening | LegacyMark',
    description: 'Monitoreo de hashtags y análisis de competidores',
};

export default async function SocialListeningPage() {
    const session = await auth();
    if (!session?.user?.id) return redirect('/auth/login');

    const companyUser = await prisma.companyUser.findFirst({ where: { userId: session.user.id } });
    if (!companyUser) {
        return (
            <div className="ds-page flex items-center justify-center">
                <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">&gt; Empresa no configurada_</p>
            </div>
        );
    }

    return (
        <div className="ds-page space-y-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4 pb-8"
                style={{ borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                <div>
                    <div className="mb-4">
                        <span className="ds-badge ds-badge-teal">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                            </span>
                            LISTENING_ENGINE · LIVE
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="ds-icon-box w-12 h-12">
                            <Ear className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h1 className="ds-heading-page">Social Listening & Sentinel</h1>
                            <p className="ds-subtext mt-2">Monitoreo en tiempo real de hashtags clave y feeds RSS de competidores del sector.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Application Area */}
            <div className="relative z-10">
                <SocialListeningDashboard companyId={companyUser.companyId} />
            </div>
        </div>
    );
}
