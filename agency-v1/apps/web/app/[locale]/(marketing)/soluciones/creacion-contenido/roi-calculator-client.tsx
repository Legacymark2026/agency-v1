'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

export function RoiCalculatorClient() {
    const t = useTranslations('creacionContenidoPage.roi');
    const [videoCount, setVideoCount] = useState(4);
    const [avgLeadValue, setAvgLeadValue] = useState(100);
    const [conversionRate, setConversionRate] = useState(2);

    const calc = useMemo(() => {
        const reach = videoCount * 2500;
        const leads = reach * (conversionRate / 100);
        const revenue = leads * avgLeadValue;
        const timeSaved = videoCount * 5;
        return { reach, leads, revenue, timeSaved };
    }, [videoCount, avgLeadValue, conversionRate]);

    const sliders = [
        { label: t('l1'), value: videoCount, min: 1, max: 20, step: 1, display: `${videoCount}`, onChange: setVideoCount },
        { label: t('l2'), value: avgLeadValue, min: 10, max: 1000, step: 10, display: `$${avgLeadValue}`, onChange: setAvgLeadValue },
        { label: t('l3'), value: conversionRate, min: 0.1, max: 5, step: 0.1, display: `${conversionRate}%`, onChange: setConversionRate },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Sliders */}
            <div className="space-y-8">
                {sliders.map((s) => (
                    <div key={s.label} className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-500">{s.label}</label>
                            <span className="text-teal-600 font-bold text-xl">{s.display}</span>
                        </div>
                        <input
                            type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                            onChange={(e) => s.onChange(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                        />
                    </div>
                ))}
            </div>

            {/* Results */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('reach')}</div>
                        <div className="text-2xl font-black text-slate-900">{calc.reach.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{t('time')}</div>
                        <div className="text-2xl font-black text-slate-900">{calc.timeSaved}h<span className="text-sm font-normal text-slate-400">{t('timeUnit')}</span></div>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">{t('revenue')}</p>
                    <div className="text-6xl font-black bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        ${Math.floor(calc.revenue).toLocaleString()}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        {t('projected')}
                    </div>
                </div>
            </div>
        </div>
    );
}
