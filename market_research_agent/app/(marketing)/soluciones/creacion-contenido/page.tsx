import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import '@/styles/content-animations.css';
import { RoiCalculatorClient } from './roi-calculator-client';
import { PricingClient } from './pricing-client';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'creacionContenidoPage.meta' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const servicesConfig = [
    { id: 's1', icon: '🎬', tag: '4K', stat: '2.4M Vistas', color: 'from-rose-500 to-pink-600' },
    { id: 's2', icon: '🎨', tag: 'HD', stat: '+12k Shares', color: 'from-violet-500 to-purple-600' },
    { id: 's3', icon: '✍️', tag: 'COPY', stat: '45% Open Rate', color: 'from-sky-500 to-blue-600' },
    { id: 's4', icon: '📊', tag: 'DATA', stat: '8.7x ROAS', color: 'from-teal-500 to-emerald-600' },
];

const stepsConfig = [
    { id: 's1', num: '01', color: 'from-violet-500 to-purple-600', glyph: '💡' },
    { id: 's2', num: '02', color: 'from-sky-500 to-cyan-500', glyph: '📋' },
    { id: 's3', num: '03', color: 'from-orange-500 to-red-500', glyph: '🎥' },
    { id: 's4', num: '04', color: 'from-teal-500 to-emerald-500', glyph: '✂️' },
    { id: 's5', num: '05', color: 'from-pink-500 to-rose-500', glyph: '🚀' },
];

const testimonialsConfig = [
    { id: 't1', author: 'Sofia R.', role: 'Marketing Director · TechStart', metric: '+2,900%', avatar: 'SR', color: 'from-violet-500 to-purple-600' },
    { id: 't2', author: 'Carlos M.', role: 'CEO · InmoGroup', metric: '18x', avatar: 'CM', color: 'from-sky-500 to-cyan-600' },
    { id: 't3', author: 'Ana P.', role: 'Founder · EcoBrand', metric: '3x', avatar: 'AP', color: 'from-teal-500 to-emerald-600' },
];

const statsConfig = [
    { id: 's1', value: '2.4B+', icon: '👁️' },
    { id: 's2', value: '8.7x', icon: '📈' },
    { id: 's3', value: '$4.2M', icon: '💰' },
    { id: 's4', value: '120+', icon: '🤝' },
];

// SVG icons for audiovisual theme
const CameraLens = () => (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
        <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="animate-aperture" />
        <circle cx="40" cy="40" r="26" stroke="currentColor" strokeWidth="1" opacity=".5" className="animate-aperture-rev" />
        <circle cx="40" cy="40" r="16" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="6" fill="currentColor" opacity=".4" />
        <circle cx="34" cy="34" r="2.5" fill="white" opacity=".6" />
    </svg>
);

const Waveform = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center gap-[3px] ${className}`} style={{ height: 32 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((_, i) => (
            <span
                key={i}
                className={`inline-block w-[3px] rounded-full bg-current wave-bar-${(i % 5) + 1}`}
                style={{ height: `${20 + Math.sin(i * 0.8) * 10}px`, animationDelay: `${i * 0.08}s`, transformOrigin: 'center' }}
            />
        ))}
    </div>
);

export default function ContentCreationPage() {
    const t = useTranslations('creacionContenidoPage');
    return (
        <main className="min-h-screen bg-white text-slate-900 overflow-hidden">

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #f0fdf4 0%, #f8fafc 55%, #eff6ff 100%)' }}>

                {/* Lens flare blobs */}
                <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-teal-200/25 rounded-full blur-[140px] pointer-events-none animate-lens" />
                <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-sky-200/25 rounded-full blur-[140px] pointer-events-none animate-lens" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-violet-100/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Camera lens decorative (top right) */}
                <div className="absolute top-8 right-8 w-24 h-24 text-teal-300/40 hidden lg:block" aria-hidden>
                    <CameraLens />
                </div>
                {/* Camera lens decorative (bottom left) */}
                <div className="absolute bottom-12 left-8 w-16 h-16 text-sky-300/30 hidden lg:block" aria-hidden>
                    <CameraLens />
                </div>

                {/* Scanline sweep */}
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/10 to-transparent pointer-events-none animate-scanline" aria-hidden />

                {/* Viewfinder corners */}
                {[
                    'top-20 left-6 border-t-2 border-l-2',
                    'top-20 right-6 border-t-2 border-r-2',
                    'bottom-6 left-6 border-b-2 border-l-2',
                    'bottom-6 right-6 border-b-2 border-r-2',
                ].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-teal-400/30 hidden md:block ${cls}`} aria-hidden />
                ))}

                {/* REC indicator */}
                <div className="absolute top-24 right-6 flex items-center gap-2 px-3 py-1 bg-black/5 backdrop-blur-sm rounded-full border border-red-200/40 hidden md:flex" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-rec" />
                    <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">REC</span>
                </div>

                <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center max-w-5xl mx-auto">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-teal-200 bg-white/80 backdrop-blur-md shadow-lg shadow-teal-100 mb-8">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-broadcast" />
                        <span className="text-teal-700 text-xs font-black tracking-widest uppercase">{t('hero.badge')}</span>
                        <Waveform className="text-teal-400" />
                    </div>

                    {/* H1 */}
                    <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-6 leading-[0.88] animate-glitch">
                        <span className="block text-slate-900">{t('hero.title1')}</span>
                        <span className="block relative">
                            <span className="absolute -inset-3 blur-3xl bg-teal-300/20 rounded-full" aria-hidden />
                            <span className="relative bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #134e4a 40%, #0891b2 100%)' }}>
                                {t('hero.title2')}
                            </span>
                        </span>
                        <span className="block bg-clip-text text-transparent stat-shine">{t('hero.title3')}</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mb-10 font-light leading-relaxed">
                        {t('hero.desc1')}<br className="hidden md:block" />
                        <span className="text-slate-700 font-semibold">{t('hero.desc2')}</span>
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-20">
                        <Link href="/contacto" className="group relative px-10 py-5 bg-slate-900 text-white font-bold text-lg rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-slate-900/30 animate-shimmer">
                            <span className="absolute inset-0 bg-gradient-to-r from-teal-500 via-sky-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="relative flex items-center gap-3">
                                🎬 {t('hero.btn1')}
                                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </span>
                        </Link>
                        <Link href="#proceso" className="px-10 py-5 rounded-2xl border-2 border-slate-200 bg-white/70 backdrop-blur-sm hover:border-teal-300 hover:bg-teal-50 transition-all text-slate-700 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5">
                            {t('hero.btn2')}
                        </Link>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                        {statsConfig.map((s, i) => (
                            <div key={s.id} className="card-lift text-center p-5 rounded-2xl bg-white border border-slate-100 shadow-md hover:shadow-xl hover:border-teal-200 transition-all" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="text-2xl mb-1">{s.icon}</div>
                                <div className="text-2xl font-black stat-shine">{s.value}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">{t(`hero.stats.${s.id}`)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Film strip at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="animate-film-scroll flex" style={{ width: '200%' }}>
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-12 h-8 border-r border-slate-200 odd:bg-slate-50 even:bg-white flex items-center justify-center">
                                <div className="w-7 h-4 rounded-sm border border-slate-200 bg-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SERVICIOS ─────────────────────────────────────────────────── */}
            <section className="py-24 bg-white relative">
                {/* Decorative waveform */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-10" aria-hidden>
                    <Waveform className="text-teal-600 scale-[2]" />
                </div>

                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    {/* Clapperboard header */}
                    <div className="flex flex-col items-center mb-16">
                        <div className="relative inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-6 overflow-hidden border border-slate-200 shadow-sm bg-white" aria-hidden>
                            <div className="absolute inset-0 overflow-hidden opacity-10">
                                <div className="animate-clap flex h-full" style={{ width: '200%' }}>
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <div key={i} className={`flex-shrink-0 w-7 h-full ${i % 2 === 0 ? 'bg-slate-900' : 'bg-white'} skew-x-[-8deg]`} />
                                    ))}
                                </div>
                            </div>
                            <span className="relative text-xs font-black tracking-widest text-slate-600 uppercase">{t('services.badge')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 text-center">{t('services.title')}</h2>
                        <p className="text-slate-500 text-lg max-w-xl text-center">{t('services.desc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {servicesConfig.map((s, i) => (
                            <div key={s.id} className="card-lift group relative p-8 rounded-3xl border border-slate-100 bg-white hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{ animationDelay: `${i * 0.08}s` }}>
                                {/* Gradient border on hover */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                                <div className={`absolute inset-[1px] rounded-[22px] border border-transparent group-hover:border-transparent bg-white`} />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl">{s.icon}</span>
                                            {/* Format tag like a camera display */}
                                            <span className={`px-2.5 py-1 text-[9px] font-black tracking-widest rounded-md text-white bg-gradient-to-r ${s.color}`}>{s.tag}</span>
                                        </div>
                                        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">{s.stat}</span>
                                    </div>

                                    {/* Waveform accent */}
                                    <div className={`mb-4 opacity-20 group-hover:opacity-50 transition-opacity text-teal-500`}>
                                        <Waveform />
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{t(`services.${s.id}Title`)}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{t(`services.${s.id}Desc`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ROI CALCULATOR ────────────────────────────────────────────── */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                {/* Aperture backdrop */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-5 text-teal-600 hidden lg:block pointer-events-none" aria-hidden>
                    <CameraLens />
                </div>

                <div className="container px-4 md:px-6 max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-rec" />
                            <span className="text-xs font-black tracking-widest text-red-500 uppercase">{t('roi.badge')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('roi.title')}</h2>
                        <p className="text-slate-500 text-lg">{t('roi.desc')}</p>
                    </div>
                    <RoiCalculatorClient />
                </div>
            </section>

            {/* ── PROCESO ───────────────────────────────────────────────────── */}
            <section id="proceso" className="py-32 bg-[#07090f] relative overflow-hidden">
                {/* Background glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Large camera lens watermark */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[350px] h-[350px] text-white/3 hidden xl:block pointer-events-none" aria-hidden>
                    <CameraLens />
                </div>

                {/* Scanline overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)' }}
                    aria-hidden
                />

                <div className="container px-4 md:px-6 max-w-4xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        {/* LIVE badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-red-500/30 bg-red-500/10 mb-6 animate-live">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-rec" />
                            <span className="text-red-400 text-xs font-black tracking-widest uppercase">{t('process.badge')}</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            {t('process.title1')}{' '}
                            <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">{t('process.title2')}</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">{t('process.desc')}</p>

                        <div className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                            <span className="text-xl">⏱</span>
                            <span className="text-white/70 text-sm">{t('process.guarantee')} <strong className="text-teal-400">{t('process.days')}</strong></span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stepsConfig.map((step, i) => (
                            <div key={step.id} className="group flex gap-5 p-6 rounded-2xl border border-white/5 bg-white/2 hover:border-teal-500/25 hover:bg-white/5 transition-all duration-300 cursor-default">
                                {/* Step number — film counter style */}
                                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center flex-shrink-0 shadow-lg`}>
                                    <span className="text-white/60 text-[8px] font-mono uppercase leading-none">TAKE</span>
                                    <span className="text-white font-black text-lg leading-none">{step.num}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                        <span className="text-lg">{step.glyph}</span>
                                        <h3 className="text-white font-bold text-lg">{t(`process.${step.id}Title`)}</h3>
                                        <span className="text-[10px] font-mono text-white/25 border border-white/10 px-2 py-0.5 rounded">{t(`process.${step.id}Time`)}</span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">{t(`process.${step.id}Desc`)}</p>
                                </div>

                                {/* Waveform indicator on hover */}
                                <div className="hidden md:flex items-center opacity-0 group-hover:opacity-40 transition-opacity text-teal-400 flex-shrink-0">
                                    <Waveform />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIOS ───────────────────────────────────────────────── */}
            <section className="py-24 bg-white relative overflow-hidden">
                {/* Film strip top */}
                <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden pointer-events-none border-b border-slate-100" aria-hidden>
                    <div className="animate-film-scroll flex" style={{ width: '200%' }}>
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-10 h-6 border-r border-slate-100 flex items-center justify-center">
                                <div className="w-6 h-3.5 rounded-sm border border-slate-200 bg-slate-50" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="container px-4 md:px-6 max-w-5xl mx-auto pt-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-3 mb-4 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                            <span className="text-amber-500">★★★★★</span>
                            <span className="text-amber-700 text-xs font-bold">{t('testimonials.rating')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                            {t('testimonials.title1')}{' '}
                            <span className="bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent">{t('testimonials.title2')}</span>
                        </h2>
                        <p className="text-slate-500 text-lg">{t('testimonials.desc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonialsConfig.map((ts, i) => (
                            <div key={ts.id} className="card-lift group relative p-8 rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 hover:border-teal-200 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                {/* Polaroid top bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${ts.color}`} />

                                {/* Quote mark watermark */}
                                <div className="absolute top-4 right-6 text-6xl font-black text-slate-100 leading-none select-none" aria-hidden>"</div>

                                {/* Metric */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                                    </div>
                                    <span className="text-2xl font-black text-teal-600 stat-shine">{ts.metric} <span className="text-xs font-normal text-slate-400 [background:none] [-webkit-text-fill-color:initial]" style={{ color: '#94a3b8' }}>{t(`testimonials.${ts.id}Metric`)}</span></span>
                                </div>

                                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{t(`testimonials.${ts.id}Text`)}"</p>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ts.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                        {ts.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{ts.author}</div>
                                        <div className="text-slate-400 text-xs">{ts.role}</div>
                                    </div>
                                </div>

                                {/* Waveform footer */}
                                <div className="mt-4 opacity-10 group-hover:opacity-30 transition-opacity text-teal-500">
                                    <Waveform />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Film strip bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none border-t border-slate-100" aria-hidden>
                    <div className="animate-film-scroll flex" style={{ width: '200%', animationDirection: 'reverse' }}>
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-10 h-6 border-r border-slate-100 flex items-center justify-center">
                                <div className="w-6 h-3.5 rounded-sm border border-slate-200 bg-slate-50" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRECIOS ───────────────────────────────────────────────────── */}
            <section className="py-24 bg-slate-50 relative" id="precios">
                {/* Broadcast tower decoration */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-10 pointer-events-none" aria-hidden>
                    {[40, 28, 18, 10].map((w, i) => (
                        <div key={i} className="border-t-2 border-teal-500 animate-broadcast" style={{ width: w, animationDelay: `${i * 0.3}s` }} />
                    ))}
                    <div className="w-0.5 h-8 bg-teal-500" />
                </div>

                <div className="container px-4 md:px-6 max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3 block">{t('pricing.badge')}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('pricing.title')}</h2>
                        <p className="text-slate-500 text-lg">{t('pricing.desc')}</p>
                    </div>
                    <PricingClient />

                    {/* Urgency bar */}
                    <div className="mt-12 p-5 rounded-2xl border border-orange-200 bg-orange-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <p className="font-bold text-orange-700 text-sm">{t('pricing.urgentTitle')}</p>
                                <p className="text-orange-600 text-sm">{t('pricing.urgentDesc1')} <strong>{t('pricing.urgentDesc2')}</strong> {t('pricing.urgentDesc3')}</p>
                            </div>
                        </div>
                        <Link href="/contacto" className="flex-shrink-0 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors text-sm">
                            {t('pricing.urgentBtn')} →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
            <section className="py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #07090f 0%, #0d1a1a 50%, #060d0d 100%)' }}>
                {/* Spotlight beams */}
                <div className="absolute top-0 left-1/4 w-[2px] h-full bg-gradient-to-b from-teal-400/20 via-transparent to-transparent animate-spotlight pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-[2px] h-full bg-gradient-to-b from-sky-400/20 via-transparent to-transparent animate-spotlight pointer-events-none" style={{ animationDelay: '3s' }} />

                {/* Large lens watermark */}
                <div className="absolute right-0 bottom-0 w-[500px] h-[500px] text-white/3 pointer-events-none hidden lg:block" aria-hidden>
                    <CameraLens />
                </div>

                {/* Scanlines */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)' }}
                    aria-hidden
                />

                {/* Channel number */}
                <div className="absolute top-6 left-6 text-white/10 font-mono font-black text-6xl leading-none select-none hidden md:block" aria-hidden>
                    CH.01
                </div>

                <div className="container px-4 md:px-6 max-w-3xl mx-auto text-center relative z-10">
                    {/* LIVE on air badge */}
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-red-500/30 bg-red-500/10 mb-8 animate-live">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-rec" />
                        <span className="text-red-400 text-xs font-black tracking-widest uppercase">{t('cta.badge')}</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        {t('cta.title1')}<br />
                        <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">{t('cta.title2')}</span>
                    </h2>

                    {/* Waveform decoration */}
                    <div className="flex justify-center mb-8 opacity-40">
                        <Waveform className="text-teal-400 scale-150" />
                    </div>

                    <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                        {t('cta.desc1')} <strong className="text-white">{t('cta.desc2')}</strong> {t('cta.desc3')}
                    </p>

                    <Link href="/contacto" className="group inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-teal-500/30 animate-shimmer">
                        🎬 {t('cta.btn')}
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </Link>

                    <div className="mt-6 flex items-center justify-center gap-6 text-slate-500 text-sm">
                        <span>{t('cta.c1')}</span>
                        <span>·</span>
                        <span>{t('cta.c2')}</span>
                        <span>·</span>
                        <span>{t('cta.c3')}</span>
                    </div>

                    {/* Viewfinder corners */}
                    {[
                        'top-0 left-0 border-t-2 border-l-2',
                        'top-0 right-0 border-t-2 border-r-2',
                        'bottom-0 left-0 border-b-2 border-l-2',
                        'bottom-0 right-0 border-b-2 border-r-2',
                    ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 border-white/10 ${cls}`} aria-hidden />
                    ))}
                </div>
            </section>
        </main>
    );
}
