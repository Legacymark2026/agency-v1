import { getMyPayouts } from '@/modules/affiliate/actions';
import { PayoutsTable } from '@/modules/affiliate/components';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { Landmark } from 'lucide-react';

export const metadata = { title: 'Mis Pagos | Afiliados' };
export const dynamic = 'force-dynamic';

export default async function PayoutsPage() {
    const result = await getMyPayouts();
    const payouts = result.data ?? [];

    const totalPaid = payouts
        .filter(p => p.status === 'PAID')
        .reduce((acc, p) => acc + parseFloat(p.amount), 0)
        .toFixed(2);

    return (
        <div className="space-y-6">
            <InteractiveSpotlight className="relative ds-card p-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[AFF · PAY]</div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Landmark size={16} className="text-violet-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white">Historial de Pagos</h2>
                            <p className="font-mono text-xs text-slate-500 mt-0.5">
                                {payouts.length} solicitud{payouts.length !== 1 ? 'es' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">Total recibido</span>
                        <span className="font-black text-2xl text-violet-400">
                            ${parseFloat(totalPaid).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </InteractiveSpotlight>

            <PayoutsTable payouts={payouts} />
        </div>
    );
}
