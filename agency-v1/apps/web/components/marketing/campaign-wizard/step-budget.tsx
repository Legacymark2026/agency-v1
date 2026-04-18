'use client';

import { useCampaignWizard, PlatformKey } from './wizard-store';
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
import { Switch } from '@/components/ui/switch';
import { 
    Info, Users, MousePointerClick, Zap, 
    Brain, Clock, BarChart3, TrendingUp, Sparkles
} from 'lucide-react';
import { useState } from 'react';

const BID_STRATEGIES = [
    { value: 'LOWEST_COST', label: 'Costo más bajo (recomendado)' },
    { value: 'COST_CAP', label: 'Límite de costo (CBO)' },
    { value: 'TARGET_COST', label: 'Costo objetivo' },
    { value: 'TCPA', label: 'tCPA — Costo por adquisición objetivo (Google)' },
    { value: 'TROAS', label: 'tROAS — Retorno objetivo (Google)' },
    { value: 'MANUAL', label: 'Puja manual' },
];

const DAY_PARTING_OPTIONS = [
    { label: 'Lunes', key: 'monday', hours: [] as number[] },
    { label: 'Martes', key: 'tuesday', hours: [] as number[] },
    { label: 'Miércoles', key: 'wednesday', hours: [] as number[] },
    { label: 'Jueves', key: 'thursday', hours: [] as number[] },
    { label: 'Viernes', key: 'friday', hours: [] as number[] },
    { label: 'Sábado', key: 'saturday', hours: [] as number[] },
    { label: 'Domingo', key: 'sunday', hours: [] as number[] },
];

const PLATFORM_HEURISTICS: Record<PlatformKey, { cpc: number; cpm: number; roas: number }> = {
    FACEBOOK_ADS: { cpc: 0.8, cpm: 6, roas: 3.2 },
    GOOGLE_ADS: { cpc: 1.2, cpm: 8, roas: 4.1 },
    TIKTOK_ADS: { cpc: 0.5, cpm: 4, roas: 2.8 },
    LINKEDIN_ADS: { cpc: 3.5, cpm: 25, roas: 5.2 },
};

export function StepBudget() {
    const { budget, startDate, endDate, setBudget, setDates, nextStep, prevStep, platforms } =
        useCampaignWizard();

    const [showSmartDistribution, setShowSmartDistribution] = useState(false);
    const [showDayParting, setShowDayParting] = useState(false);
    const [smartBudgetEnabled, setSmartBudgetEnabled] = useState(false);

    const canContinue = budget.amount > 0;

    // HUD Estimations
    const estimatedReach = budget.amount > 0 ? `${(budget.amount * 45).toLocaleString('en-US')} - ${(budget.amount * 120).toLocaleString('en-US')}` : '---';
    const estimatedClicks = budget.amount > 0 ? `${Math.floor(budget.amount * 1.2)} - ${Math.floor(budget.amount * 3.5)}` : '---';

    // Smart Budget Distribution
    const calculateSmartDistribution = () => {
        if (!smartBudgetEnabled || platforms.length === 0) return [];
        
        const total = budget.amount;
        const distributions = platforms.map(platform => {
            const heuristics = PLATFORM_HEURISTICS[platform];
            const weight = platform === 'FACEBOOK_ADS' ? 0.35 :
                          platform === 'GOOGLE_ADS' ? 0.30 :
                          platform === 'TIKTOK_ADS' ? 0.25 : 0.10;
            
            return {
                platform,
                percentage: weight * 100,
                suggestedAmount: total * weight,
                historicalPerformance: heuristics,
            };
        });
        
        return distributions;
    };

    const smartDistribution = calculateSmartDistribution();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Smart Budget Distribution */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            <Label className="text-sm font-semibold text-white">Distribución Inteligente de Presupuesto</Label>
                        </div>
                        <Switch 
                            checked={smartBudgetEnabled} 
                            onCheckedChange={setSmartBudgetEnabled}
                        />
                    </div>
                    {smartBudgetEnabled && platforms.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {smartDistribution.map((dist) => (
                                <div key={dist.platform} className="bg-white/5 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-400 mb-1">{dist.platform.replace('_ADS', '')}</p>
                                    <p className="text-lg font-bold text-white font-mono">${Math.round(dist.suggestedAmount).toLocaleString()}</p>
                                    <p className="text-xs text-purple-400">{dist.percentage.toFixed(0)}%</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {smartBudgetEnabled && platforms.length === 0 && (
                        <p className="text-sm text-yellow-400">Selecciona plataformas primero</p>
                    )}
                </div>

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
                    <div className="p-5 border border-white/10 rounded-xl bg-slate-900/50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-300">Selección de Horarios</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-teal-500 rounded-sm shadow-[0_0_8px_rgba(20,184,166,0.3)]"></div> Activo</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded-sm border border-white/5"></div> Pausado</div>
                            </div>
                        </div>
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-[500px]">
                                <div className="flex gap-px mb-1 relative ml-12 pr-1 text-xs text-slate-500 justify-between">
                                    <span>0:00</span>
                                    <span>6:00</span>
                                    <span>12:00</span>
                                    <span>18:00</span>
                                    <span>23:00</span>
                                </div>
                                <div className="space-y-1.5 pt-2">
                                    {DAY_PARTING_OPTIONS.map((day) => {
                                        const schedule = (budget.dayParting?.schedule as any) || {};
                                        const activeHours = schedule[day.key] || [];
                                        
                                        return (
                                            <div key={day.key} className="flex items-center gap-2">
                                                <div className="w-10 text-xs text-slate-400 font-medium">{day.label.substring(0,3)}</div>
                                                <div className="flex-1 flex gap-px">
                                                    {[...Array(24)].map((_, hour) => {
                                                        const isActive = activeHours.includes(hour);
                                                        return (
                                                            <button
                                                                key={hour}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newSchedule = { ...schedule };
                                                                    const newHours = [...(newSchedule[day.key] || [])];
                                                                    if (isActive) {
                                                                        newSchedule[day.key] = newHours.filter((h: number) => h !== hour);
                                                                    } else {
                                                                        newSchedule[day.key] = [...newHours, hour].sort((a: number,b: number) => a-b);
                                                                    }
                                                                    setBudget({ dayParting: { ...budget.dayParting, enabled: true, schedule: newSchedule } as any });
                                                                }}
                                                                className={`flex-1 h-7 rounded-sm transition-colors border border-white/5 ${isActive ? 'bg-teal-500 hover:bg-teal-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                                                                title={`${day.label} a las ${hour}:00`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setBudget({ dayParting: { ...budget.dayParting, enabled: true, schedule: {} } as any })}
                                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7"
                            >
                                Borrar todo
                            </Button>
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

                        {/* Platform Performance Heuristics */}
                        {platforms.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="text-xs font-semibold uppercase">Rendimiento por Plataforma</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {platforms.map(p => {
                                        const perf = PLATFORM_HEURISTICS[p];
                                        return (
                                            <div key={p} className="bg-white/5 rounded-lg p-2 text-center">
                                                <p className="text-xs text-gray-400">{p.replace('_ADS', '')}</p>
                                                <div className="flex justify-between text-xs mt-1">
                                                    <span className="text-green-400">ROAS: {perf.roas}x</span>
                                                </div>
                                                <div className="text-xs text-gray-500">CPC: ${perf.cpc}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
