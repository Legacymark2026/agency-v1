'use client';

import { useState, useTransition } from 'react';
import type { CommissionPlan } from '../types';
import { createCommissionPlan, deleteCommissionPlan } from '../actions';
import { Plus, Trash2, Percent, DollarSign, Shield, Loader2 } from 'lucide-react';

interface Props {
    plans: CommissionPlan[];
}

export function CommissionPlansManager({ plans: initialPlans }: Props) {
    const [plans, setPlans] = useState(initialPlans);
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT', value: '', warrantyDays: '15' });
    const [error, setError] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        const value = parseFloat(form.value);
        if (!form.name || isNaN(value) || value <= 0) { setError('Completa todos los campos correctamente.'); return; }

        startTransition(async () => {
            const res = await createCommissionPlan({
                name: form.name,
                type: form.type,
                value,
                warrantyDays: parseInt(form.warrantyDays) || 15,
            });
            if (res.success && res.data) {
                setPlans(p => [res.data!, ...p]);
                setForm({ name: '', type: 'PERCENTAGE', value: '', warrantyDays: '15' });
                setShowForm(false);
            } else {
                setError(res.error ?? 'Error al crear plan');
            }
        });
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            const res = await deleteCommissionPlan(id);
            if (res.success) setPlans(p => p.filter(x => x.id !== id));
        });
    }

    return (
        <div className="space-y-4">
            {/* Create button */}
            <div className="flex justify-end">
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest font-bold transition-all"
                    style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.4)', color: '#2dd4bf' }}>
                    <Plus size={14} />
                    Nuevo Plan
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleSubmit}
                    className="rounded-sm p-5 space-y-4"
                    style={{ background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(13,148,136,0.25)' }}>
                    <p className="font-mono text-xs uppercase tracking-widest text-teal-400">Crear Nuevo Plan</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5">Nombre del Plan</label>
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-sm font-mono text-sm text-slate-200 bg-transparent outline-none"
                                style={{ border: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.8)' }}
                                placeholder="Plan Estándar 10%" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5">Tipo</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                className="w-full px-3 py-2.5 rounded-sm font-mono text-sm text-slate-200 outline-none"
                                style={{ border: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.8)' }}>
                                <option value="PERCENTAGE">Porcentaje (%)</option>
                                <option value="FLAT">Monto Fijo ($)</option>
                            </select>
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5">
                                Valor {form.type === 'PERCENTAGE' ? '(%)' : '($)'}
                            </label>
                            <input type="number" min="0" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-sm font-mono text-sm text-slate-200 outline-none"
                                style={{ border: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.8)' }}
                                placeholder="10" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5">Días de Garantía</label>
                            <input type="number" min="0" value={form.warrantyDays} onChange={e => setForm(f => ({ ...f, warrantyDays: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-sm font-mono text-sm text-slate-200 outline-none"
                                style={{ border: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.8)' }}
                                placeholder="15" />
                        </div>
                    </div>
                    {error && <p className="font-mono text-xs text-rose-400">{error}</p>}
                    <div className="flex gap-3">
                        <button type="submit" disabled={isPending}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest font-bold transition-all"
                            style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.5)', color: '#2dd4bf' }}>
                            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            Crear Plan
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest text-slate-500 transition-all"
                            style={{ border: '1px solid rgba(30,41,59,0.6)' }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Plans list */}
            <div className="space-y-3">
                {plans.length === 0 && (
                    <div className="text-center py-10">
                        <p className="font-mono text-xs uppercase tracking-widest text-slate-600">Sin planes creados</p>
                    </div>
                )}
                {plans.map(plan => (
                    <div key={plan.id}
                        className="flex items-center justify-between px-5 py-4 rounded-sm transition-all hover:bg-slate-900/30"
                        style={{ background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(30,41,59,0.6)' }}>
                        <div className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                {plan.type === 'PERCENTAGE'
                                    ? <Percent size={14} className="text-teal-400" />
                                    : <DollarSign size={14} className="text-teal-400" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-200">{plan.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="font-mono text-xs text-teal-400">
                                        {plan.type === 'PERCENTAGE' ? `${plan.value}%` : `$${plan.value}`}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-600">·</span>
                                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                                        <Shield size={9} /> Cookie: {plan.cookieLifetimeInt} días
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(plan.id)} disabled={isPending}
                            className="w-8 h-8 rounded-sm flex items-center justify-center transition-all hover:bg-rose-500/10"
                            style={{ border: '1px solid rgba(30,41,59,0.6)', color: '#475569' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#fb7185')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
