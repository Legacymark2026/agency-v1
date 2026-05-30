import { getMyReferrals } from '@/modules/affiliate/actions';
import { ReferralsTable } from '@/modules/affiliate/components';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { Users } from 'lucide-react';

export const metadata = { title: 'Mis Referidos | Afiliados' };
export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
    const result = await getMyReferrals();
    const referrals = result.data ?? [];

    return (
        <div className="space-y-6">
            <InteractiveSpotlight className="relative ds-card p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[AFF · REF]</div>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Users size={16} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-white">Mis Referidos</h2>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">
                            {referrals.length} registro{referrals.length !== 1 ? 's' : ''} · Actualizados en tiempo real
                        </p>
                    </div>
                </div>
            </InteractiveSpotlight>

            <ReferralsTable referrals={referrals} />
        </div>
    );
}
