'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PricingClient() {
    const t = useTranslations('creacionContenidoPage.pricing');
    const [selected, setSelected] = useState('Growth');

    const features = [
        t('f1'), t('f2'), t('f3'), t('f4'), t('f5'), t('f6'), t('f7'), t('f8')
    ];

    const packages = [
        { name: 'Starter', price: '2.5M', description: t('p1Desc'), features: [true, true, false, true, true, false, false, true], popular: false },
        { name: 'Growth', price: '4.5M', description: t('p2Desc'), features: [true, true, true, true, true, true, false, true], popular: true },
        { name: 'Dominance', price: '8M', description: t('p3Desc'), features: [true, true, true, true, true, true, true, true], popular: false },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
                <div
                    key={pkg.name}
                    onClick={() => setSelected(pkg.name)}
                    className={`relative p-8 rounded-3xl border cursor-pointer transition-all duration-300 ${pkg.popular
                        ? 'border-teal-400 shadow-2xl shadow-teal-900/10 bg-white ring-2 ring-teal-400/20'
                        : selected === pkg.name
                            ? 'border-slate-300 shadow-xl bg-white'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
                        }`}
                >
                    {pkg.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                            {t('popular')}
                        </div>
                    )}

                    <h3 className={`text-2xl font-bold mb-1 ${pkg.popular ? 'text-teal-600' : 'text-slate-900'}`}>{pkg.name}</h3>
                    <p className="text-slate-500 text-sm mb-5 h-10">{pkg.description}</p>

                    <div className="mb-6">
                        <span className="text-4xl font-black text-slate-900">${pkg.price}</span>
                        <span className="text-slate-400 text-sm ml-2">{t('month')}</span>
                    </div>

                    <Link
                        href="/contacto"
                        className={`block w-full py-3.5 rounded-xl font-bold text-center mb-6 transition-all ${pkg.popular
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-teal-500/20'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        {t('btn')} →
                    </Link>

                    <div className="space-y-3">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${pkg.features[i] ? 'bg-teal-100 text-teal-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <Check className="w-3 h-3" />
                                </div>
                                <span className={`text-sm ${!pkg.features[i] ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
