import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('methodologyPage.meta');
    return {
        title: t('title'),
        description: t('description'),
    };
}

const stepsConfig = [
    { color: "from-violet-500 to-purple-600", bg: "bg-violet-950/20", border: "border-violet-500/20" },
    { color: "from-blue-500 to-cyan-400", bg: "bg-blue-950/20", border: "border-blue-500/20" },
    { color: "from-orange-500 to-amber-500", bg: "bg-orange-950/20", border: "border-orange-500/20" },
    { color: "from-emerald-500 to-teal-400", bg: "bg-emerald-950/20", border: "border-emerald-500/20" },
];

export default async function MetodologiaPage() {
    const t = await getTranslations('methodologyPage');

    const steps = [0, 1, 2, 3].map((index) => ({
        number: `0${index + 1}`,
        title: t(`steps.${index}.title`),
        description: t(`steps.${index}.description`),
        color: stepsConfig[index].color,
        bg: stepsConfig[index].bg,
        items: [
            t(`steps.${index}.items.0`),
            t(`steps.${index}.items.1`),
            t(`steps.${index}.items.2`),
            t(`steps.${index}.items.3`),
        ],
        border: stepsConfig[index].border
    }));

    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth min-h-screen">
            {/* Global Editorial Noise */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* Global Spotlight Glow */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,transparent_60%)] pointer-events-none -z-10" />

            {/* Hero */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/80 via-slate-950 to-slate-950 opacity-80" />
                <div className="relative max-w-5xl mx-auto px-6 text-center">
                    <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">{t('hero.badge')}</span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        {t('hero.titleStart')}<br />
                        <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{t('hero.titleHighlight')}</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        {t('hero.description')}
                    </p>
                </div>
            </section>

            {/* Steps */}
            <section className="max-w-6xl mx-auto px-6 py-24">
                <div className="space-y-20">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className={`flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-center group`}
                        >
                            {/* Number + Title */}
                            <div className="flex-1 space-y-6">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white font-black text-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500`}>
                                    {step.number}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">{step.title}</h2>
                                <p className="text-lg text-gray-400 leading-relaxed font-light">{step.description}</p>
                                <ul className="space-y-3 pt-2">
                                    {step.items.map(item => (
                                        <li key={item} className="flex items-center gap-3 text-gray-300">
                                            <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.color} flex-shrink-0 shadow-lg`} />
                                            <span className="font-medium text-[15px]">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Visual card */}
                            <div className={`flex-1 ${step.bg} ${step.border} border backdrop-blur-sm rounded-[2rem] p-10 flex items-center justify-center min-h-[320px] shadow-2xl relative overflow-hidden group-hover:border-opacity-50 transition-all duration-500`}>
                                {/* Inner glow */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 mix-blend-overlay`} />

                                <span className={`text-[150px] font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent leading-none select-none opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 ease-out drop-shadow-2xl`}>
                                    {step.number}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-32 px-6 text-center overflow-hidden">
                {/* Decorative background grid for CTA */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] mix-blend-screen pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                        {t('cta.title')}
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto font-light leading-relaxed">
                        {t('cta.description')}
                    </p>
                    <Link
                        href="/contacto"
                        className="group relative inline-flex items-center justify-center bg-white text-black font-bold text-lg px-12 py-5 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        {t('cta.button')}
                        <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100" />
                    </Link>
                </div>
            </section>
        </main>
    );
}
