'use client';

import { useCampaignWizard } from './wizard-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Info, Users, MousePointerClick, Zap } from 'lucide-react';

const BID_STRATEGIES = [
    { value: 'LOWEST_COST', label: 'Costo más bajo (recomendado)' },
    { value: 'COST_CAP', label: 'Límite de costo (CBO)' },
    { value: 'TARGET_COST', label: 'Costo objetivo' },
    { value: 'TCPA', label: 'tCPA — Costo por adquisición objetivo (Google)' },
    { value: 'TROAS', label: 'tROAS — Retorno objetivo (Google)' },
    { value: 'MANUAL', label: 'Puja manual' },
];

export function StepBudget() {
    const { budget, startDate, endDate, setBudget, setDates, nextStep, prevStep } =
        useCampaignWizard();

    const canContinue = budget.amount > 0;

    // HUD Estimations
    const estimatedReach = budget.amount > 0 ? `${(budget.amount * 45).toLocaleString('en-US')} - ${(budget.amount * 120).toLocaleString('en-US')}` : '---';
    const estimatedClicks = budget.amount > 0 ? `${Math.floor(budget.amount * 1.2)} - ${Math.floor(budget.amount * 3.5)}` : '---';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Budget Type */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-300">Tipo de Presupuesto</Label>
                <div className="grid grid-cols-2 gap-3">
                    {(['DAILY', 'LIFETIME'] as const).map((type) => (
                        <button
                            key={type}
                            id={`budget-type-${type.toLowerCase()}`}
                            type="button"
                            onClick={() => setBudget({ type })}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${budget.type === type
                                    ? 'border-teal-500 bg-teal-500/10'
                                    : 'border-white/10 bg-white/3 hover:border-white/20'
                                }`}
                        >
                            <p className="font-semibold text-white text-sm">
                                {type === 'DAILY' ? 'Diario (ABO)' : 'Total (CBO)'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {type === 'DAILY'
                                    ? 'Controla el gasto por día por conjunto de anuncios'
                                    : 'El algoritmo optimiza el gasto total de la campaña'}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Budget Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="budget-amount" className="text-sm font-semibold text-gray-300">
                        Monto ({budget.type === 'DAILY' ? 'por día' : 'total'})
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <Input
                            id="budget-amount"
                            type="number"
                            min={1}
                            value={budget.amount}
                            onChange={(e) => setBudget({ amount: parseFloat(e.target.value) || 0 })}
                            className="bg-white/5 border-white/10 text-white pl-8 h-11"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-300">Moneda</Label>
                    <Select value={budget.currency} onValueChange={(v) => setBudget({ currency: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                            {['USD', 'EUR', 'MXN', 'COP', 'ARS', 'BRL'].map((c) => (
                                <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bid Strategy */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-300">Estrategia de Puja</Label>
                <Select
                    value={budget.bidStrategy}
                    onValueChange={(v) => setBudget({ bidStrategy: v as typeof budget.bidStrategy })}
                >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10">
                        {BID_STRATEGIES.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-white hover:bg-white/10">
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Bid Amount (conditional) */}
            {(budget.bidStrategy === 'MANUAL' || budget.bidStrategy === 'TCPA') && (
                <div className="space-y-2">
                    <Label htmlFor="bid-amount" className="text-sm font-semibold text-gray-300">
                        Monto de Puja ($)
                    </Label>
                    <div className="flex items-start gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                            <Input
                                id="bid-amount"
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={budget.bidAmount ?? ''}
                                onChange={(e) => setBudget({ bidAmount: parseFloat(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10 text-white pl-8 h-11"
                            />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 pt-3">
                            <Info className="w-3 h-3" />
                            <span>CPC / CPA objetivo</span>
                        </div>
                    </div>
                </div>
            )}

            {budget.bidStrategy === 'COST_CAP' && (
                <div className="space-y-2">
                    <Label htmlFor="cost-cap-amount" className="text-sm font-semibold text-gray-300">
                        Límite de Costo (Cost Cap)
                    </Label>
                    <div className="flex items-start gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                            <Input
                                id="cost-cap-amount"
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={budget.costCapAmount ?? ''}
                                onChange={(e) => setBudget({ costCapAmount: parseFloat(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10 text-white pl-8 h-11"
                            />
                        </div>
                    </div>
                </div>
            )}

            {budget.bidStrategy === 'TROAS' && (
                <div className="space-y-2">
                    <Label htmlFor="roas-target" className="text-sm font-semibold text-gray-300">
                        ROAS Objetivo (%)
                    </Label>
                    <div className="flex items-start gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="roas-target"
                                type="number"
                                min={1}
                                step={1}
                                value={budget.roasTarget ?? ''}
                                onChange={(e) => setBudget({ roasTarget: parseFloat(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10 text-white pr-8 h-11"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Pacing Controls */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-300">Estrategia de Pacing (Entrega)</Label>
                <div className="grid grid-cols-2 gap-3">
                    {(['STANDARD', 'ACCELERATED'] as const).map((pacing) => (
                        <button
                            key={pacing}
                            type="button"
                            onClick={() => setBudget({ pacing })}
                            className={`p-3 rounded-lg border text-left transition-all ${budget.pacing === pacing
                                    ? 'border-teal-500 bg-teal-500/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                }`}
                        >
                            <p className="font-semibold text-white text-sm">
                                {pacing === 'STANDARD' ? 'Estándar' : 'Acelerada'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {pacing === 'STANDARD' ? 'Distribuye el gasto uniformemente' : 'Gasta lo más rápido posible'}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Day-Parting Schedule Visualization Toggle */}
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-sm font-semibold text-gray-300">Programación de Anuncios (Day-Parting)</Label>
                        <p className="text-xs text-gray-500 mt-1">Activa para definir días y horarios específicos.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setBudget({ dayParting: { ...budget.dayParting, enabled: !budget.dayParting?.enabled } as any })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${budget.dayParting?.enabled ? 'bg-teal-500' : 'bg-gray-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${budget.dayParting?.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {budget.dayParting?.enabled && (
                    <div className="p-6 border border-white/10 rounded-xl bg-white/5 text-center">
                        <Users className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">Cuadrícula de Horarios</h4>
                        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">Selecciona los bloques de tiempo (hora a hora) en los que deseas que tus anuncios estén activos (Simulación visual activa).</p>
                        <div className="mt-4 grid grid-cols-7 gap-1 h-32 opacity-60">
                            {[...Array(7)].map((_, day) => (
                                <div key={day} className="flex flex-col gap-1">
                                    {[...Array(8)].map((_, hour) => (
                                        <div key={hour} className={`flex-1 rounded-xs ${ (day + hour) % 3 === 0 ? 'bg-teal-500/40' : 'bg-white/5'}`} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-semibold text-gray-300">Fecha de Inicio</Label>
                    <Input
                        id="start-date"
                        type="date"
                        value={startDate ?? ''}
                        onChange={(e) => setDates(e.target.value, endDate)}
                        className="bg-white/5 border-white/10 text-white h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-semibold text-gray-300">Fecha de Fin (opcional)</Label>
                    <Input
                        id="end-date"
                        type="date"
                        value={endDate ?? ''}
                        onChange={(e) => setDates(startDate, e.target.value)}
                        className="bg-white/5 border-white/10 text-white h-11"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="text-gray-400 hover:text-white">
                    ← Atrás
                </Button>
                <Button
                    id="wizard-next-step-2"
                    onClick={nextStep}
                    disabled={!canContinue}
                    className="bg-teal-700 hover:bg-teal-600 text-white px-8 h-11 disabled:opacity-40"
                >
                    Continuar →
                </Button>
            </div>
            </div>

            {/* Visual HUD (Right Column) */}
            <div className="lg:col-span-1">
                <Card className="bg-slate-900 border-slate-800 sticky top-4 shadow-2xl">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-2 text-teal-400">
                            <Zap className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wider font-mono">Estimaciones Diarias</h3>
                        </div>
                        <p className="text-xs text-slate-500">
                            Los resultados estimados se basan en el presupuesto y métricas históricas del mercado regional. No son garantía de resultados.
                        </p>
                        
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div>
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Users className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Alcance Estimado</span>
                                </div>
                                <p className="text-xl font-mono text-slate-200">{estimatedReach}</p>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <MousePointerClick className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Clics Estimados (Link)</span>
                                </div>
                                <p className="text-xl font-mono text-slate-200">{estimatedClicks}</p>
                            </div>
                        </div>

                        <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20 mt-4">
                            <p className="text-xs text-teal-300 flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>Aumentar el presupuesto o cambiar a CBO podría mejorar la estabilidad de estas métricas.</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
