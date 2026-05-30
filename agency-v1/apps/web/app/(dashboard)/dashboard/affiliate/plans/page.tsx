import { getCommissionPlans } from '@/modules/affiliate/actions';
import { CommissionPlansManager } from '@/modules/affiliate/components';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { Percent } from 'lucide-react';

export const metadata = { title: 'Planes de Comisión | Afiliados' };
export const dynamic = 'force-dynamic';

export default async function PlansPage() {
    const result = await getCommissionPlans();
    const plans = result.data ?? [];

    return (
        <div className="space-y-6">
            <InteractiveSpotlight className="relative ds-card p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[AFF · PLN]</div>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                        <Percent size={16} className="text-teal-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl text-white">Planes de Comisión</h2>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">
                            {plans.length} plan{plans.length !== 1 ? 'es' : ''} configurado{plans.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </InteractiveSpotlight>

            <CommissionPlansManager plans={plans} />
        </div>
    );
}
