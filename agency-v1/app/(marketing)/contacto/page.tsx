import { ContactForm } from "@/components/sections/contact-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations('contactPage.meta');
    return {
        title: t('title'),
        description: t('description'),
    };
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const contactMethodsConfig = [
    { key: 'email', icon: '✉️', value: 'legacymarkcolombia@legacymarksas.com', href: 'mailto:legacymarkcolombia@legacymarksas.com', color: 'from-violet-500 to-purple-600' },
    { key: 'whatsapp', icon: '📱', value: '+57 322 304 7353', href: 'https://wa.me/573223047353', color: 'from-teal-500 to-emerald-600' },
    { key: 'office', icon: '📍', value: '', href: '#', color: 'from-sky-500 to-blue-600' },
];

const processStepsConfig = [
    { num: '01', key: 's1', icon: '📝' },
    { num: '02', key: 's2', icon: '🔍' },
    { num: '03', key: 's3', icon: '📞' },
    { num: '04', key: 's4', icon: '🚀' },
];

const trustedBy = ['TechStart', 'InmoGroup', 'EcoBrand', 'MediaFlow', 'GrowthCo', 'BrandLab'];

const faqsConfig = ['q1', 'q2', 'q3'];

// SVG globe decoration
const GridOrb = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.5">
        <circle cx="100" cy="100" r="90" strokeDasharray="4 3" />
        <circle cx="100" cy="100" r="60" />
        <circle cx="100" cy="100" r="30" />
        <ellipse cx="100" cy="100" rx="90" ry="30" />
        <ellipse cx="100" cy="100" rx="90" ry="60" />
        <line x1="100" y1="10" x2="100" y2="190" />
        <line x1="10" y1="100" x2="190" y2="100" />
        <circle cx="100" cy="100" r="6" fill="currentColor" opacity=".5" />
        <circle cx="64" cy="64" r="3" fill="currentColor" opacity=".4" />
        <circle cx="140" cy="130" r="2.5" fill="currentColor" opacity=".3" />
    </svg>
);

// Floating dot grid
const DotGrid = ({ cols = 8, rows = 6 }: { cols?: number; rows?: number }) => (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
            <div
                key={i}
                className="w-1 h-1 rounded-full bg-current"
                style={{ animationDelay: `${(i * 0.07) % 2}s`, opacity: 0.08 + (i % 5) * 0.04 }}
            />
        ))}
    </div>
);

// Pulse ring component (pure CSS)
const PulseRings = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        {[1, 2, 3].map((i) => (
            <div
                key={i}
                className="absolute rounded-full border border-teal-400/10 animate-ping"
                style={{ width: i * 180, height: i * 180, animationDuration: `${2 + i}s`, animationDelay: `${i * 0.5}s` }}
            />
        ))}
    </div>
);

export default async function ContactPage() {
    const t = await getTranslations('contactPage');

    return (
        <main className="relative bg-slate-950 text-white overflow-hidden scroll-smooth">

            {/* ── Dense Editorial Noise ─────────────────────────────────── */}
            <div className="bg-noise fixed inset-0 z-50 pointer-events-none mix-blend-multiply opacity-[0.015]" />

            {/* ── Global Spotlight Glow ──────────────────────────────────── */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08)_0%,transparent_60%)] pointer-events-none -z-10" />
            <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.06)_0%,transparent_70%)] pointer-events-none -z-10" />

            {/* ── HERO SECTION ─────────────────────────────────────────────── */}
            <section className="relative pt-20 sm:pt-28 pb-12 sm:pb-20 overflow-hidden">

                {/* Animated radial blobs */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

                {/* Dot grids */}
                <div className="absolute top-20 left-6 text-teal-500/30 hidden lg:block pointer-events-none" aria-hidden>
                    <DotGrid cols={8} rows={5} />
                </div>
                <div className="absolute bottom-8 right-6 text-slate-600/50 hidden lg:block pointer-events-none" aria-hidden>
                    <DotGrid cols={6} rows={4} />
                </div>

                {/* Globe orb top right */}
                <div className="absolute top-16 right-8 w-48 h-48 text-teal-400/10 hidden xl:block pointer-events-none" aria-hidden>
                    <GridOrb />
                </div>

                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-teal-400/60 to-transparent" aria-hidden />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-500 -translate-y-1" aria-hidden />

                {/* Viewfinder corners */}
                {['top-20 left-4 border-t-2 border-l-2', 'top-20 right-4 border-t-2 border-r-2', 'bottom-4 left-4 border-b-2 border-l-2', 'bottom-4 right-4 border-b-2 border-r-2'].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-teal-500/20 hidden md:block ${cls}`} aria-hidden />
                ))}

                {/* Status indicator */}
                <div className="absolute top-24 right-5 flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-full shadow-sm hidden md:flex" aria-hidden>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDuration: '2s' }} />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t('hero.status')}</span>
                </div>

                <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 backdrop-blur-md shadow-md mb-8">
                        <span className="text-teal-400 text-sm">📬</span>
                        <span className="text-teal-400 text-xs font-black tracking-widest uppercase">{t('hero.badge')}</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
                        <span className="block text-white">{t('hero.titleStart')}</span>
                        <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 50%, #a78bfa 100%)' }}>{t('hero.titleHighlight')}</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
                        {t.rich('hero.description', {
                            highlight: (chunks) => <span className="text-white font-semibold">{chunks}</span>
                        })}
                    </p>

                    {/* Trust micro-proof */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            {[t('hero.trust.t1'), t('hero.trust.t2'), t('hero.trust.t3')].map((tStr) => (
                                <span key={tStr} className="text-xs font-medium text-slate-400 px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 shadow-sm">{tStr}</span>
                            ))}
                        </div>

                        {/* Trusted by marquee */}
                        <div className="mt-4 overflow-hidden w-full max-w-xl">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">{t('hero.trustedByLabel')}</p>
                            <div className="flex gap-6 overflow-hidden">
                                <div className="flex gap-6 shrink-0 animate-marquee">
                                    {[...trustedBy, ...trustedBy].map((name, i) => (
                                        <span key={i} className="text-sm font-bold text-slate-600 whitespace-nowrap">{name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PROCESS STEPS ────────────────────────────────────────────── */}
            <section className="py-10 sm:py-16 bg-slate-900/50 border-y border-slate-800">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                        {processStepsConfig.map((step, i) => (
                            <div key={step.num} className="relative group flex flex-col items-center text-center p-6">
                                {/* Connector line */}
                                {i < processStepsConfig.length - 1 && (
                                    <div className="absolute right-0 top-[44px] w-1/2 h-px bg-gradient-to-r from-teal-500/30 to-slate-800 hidden md:block" aria-hidden />
                                )}
                                <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-800/80 border border-teal-500/20 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 group-hover:border-teal-400/50 transition-all duration-300 shadow-sm shadow-teal-500/5">
                                    {step.icon}
                                    <span className="absolute -top-1.5 -right-1.5 text-[10px] font-black text-teal-400 bg-slate-900 border border-teal-500/30 rounded-full w-5 h-5 flex items-center justify-center">{step.num}</span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{t(`process.${step.key}.title`)}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{t(`process.${step.key}.desc`)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN: INFO + FORM ─────────────────────────────────────────── */}
            <section className="py-12 sm:py-20">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <div className="grid gap-12 lg:grid-cols-5 items-start">

                        {/* ─── LEFT COLUMN: Contact Info ─── */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Section label */}
                            <div>
                                <span className="text-xs font-black text-teal-400 uppercase tracking-widest block mb-3">{t('info.badge')}</span>
                                <h2 className="text-2xl font-black text-white mb-2">{t('info.title')}</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">{t('info.desc')}</p>
                            </div>

                            {/* Contact method cards */}
                            <div className="space-y-4">
                                {contactMethodsConfig.map((m) => (
                                    <a
                                        key={m.key}
                                        href={m.href}
                                        className="card-lift group flex items-start gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 relative overflow-hidden no-underline backdrop-blur-sm"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
                                        <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl shadow-md flex-shrink-0`}>
                                            {m.icon}
                                        </div>
                                        <div className="relative z-10 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{t(`methods.${m.key}.label`)}</p>
                                            <p className="font-bold text-white text-sm truncate">{m.value || t(`methods.${m.key}.val`)}</p>
                                            <p className="text-xs text-teal-400 font-medium mt-0.5">{t(`methods.${m.key}.sub`)}</p>
                                        </div>
                                        <div className="relative z-10 ml-auto text-slate-600 group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0 self-center">→</div>
                                    </a>
                                ))}
                            </div>

                            {/* Response time card */}
                            <div className="relative p-6 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden backdrop-blur-sm">
                                <PulseRings />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{t('info.responseTime.badge')}</span>
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-5xl font-black text-white">{t('info.responseTime.val')}</span>
                                        <span className="text-xl font-bold text-slate-500 mb-2">{t('info.responseTime.unit')}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-2 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: '85%' }} />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">{t('info.responseTime.desc')}</p>
                                </div>
                            </div>

                            {/* FAQs */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">{t('info.faq.badge')}</h3>
                                {faqsConfig.map((faqKey, i) => (
                                    <div key={i} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-teal-500/30 hover:shadow-sm hover:shadow-teal-500/5 transition-all backdrop-blur-sm">
                                        <p className="font-bold text-white text-sm mb-1">{t(`info.faq.${faqKey}.q`)}</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">{t(`info.faq.${faqKey}.a`)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── RIGHT COLUMN: Form ─── */}
                        <div className="lg:col-span-3">
                            {/* Form wrapper with premium feel */}
                            <div className="relative rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-teal-500/5 overflow-hidden mx-auto max-w-full backdrop-blur-sm">
                                {/* Gradient top bar */}
                                <div className="h-1.5 bg-gradient-to-r from-teal-400 via-sky-500 to-violet-500" />

                                {/* Form header */}
                                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-black text-white">{t('form.title')}</h2>
                                            <p className="text-slate-400 text-sm mt-0.5">{t('form.desc')}</p>
                                        </div>
                                        {/* Security badge */}
                                        <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-700 bg-slate-800/50">
                                            <span className="text-xl">🔒</span>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{t('form.secure')}</span>
                                        </div>
                                    </div>

                                    {/* Form progress hint */}
                                    <div className="flex gap-1 mt-5">
                                        {[1, 2, 3].map((s) => (
                                            <div key={s} className={`h-1 flex-1 rounded-full ${s === 1 ? 'bg-gradient-to-r from-teal-400 to-sky-400' : 'bg-slate-700'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1">{t('form.step')}</p>
                                </div>

                                {/* The form itself */}
                                <div className="p-5 sm:p-8">
                                    <ContactForm />
                                </div>

                                {/* Form footer trust signals */}
                                <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                                    {[t('form.trust.t1'), t('form.trust.t2'), t('form.trust.t3')].map((tStr, i) => (
                                        <span key={i} dangerouslySetInnerHTML={{ __html: tStr }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF STRIP ───────────────────────────────────────── */}
            <section className="py-8 sm:py-14 bg-slate-900/50 border-y border-slate-800">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
                        {trustedBy.map((name) => (
                            <div key={name} className="text-center p-3 rounded-xl hover:bg-slate-800/50 hover:shadow-sm transition-all cursor-default">
                                <span className="text-sm font-bold text-slate-600 hover:text-slate-400 transition-colors">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAP SECTION ──────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-10 items-center">

                        {/* Globe visualization */}
                        <div className="relative aspect-square max-w-sm mx-auto">
                            {/* Pulse rings around globe */}
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="absolute inset-0 rounded-full border border-teal-400/20 animate-ping"
                                    style={{ animationDuration: `${3 + i}s`, animationDelay: `${i * 0.8}s`, transform: `scale(${0.85 + i * 0.1})` }}
                                    aria-hidden
                                />
                            ))}
                            <div className="absolute inset-8 text-teal-400/30 opacity-80">
                                <GridOrb />
                            </div>
                            {/* Location pin */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="relative">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-400/50 animate-pulse" />
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-teal-400 to-transparent" />
                                </div>
                            </div>
                            {/* Coordinate badge */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-700 shadow-lg text-center whitespace-nowrap">
                                <p className="text-[10px] font-mono text-slate-500">7.0682° N, 73.1698° W</p>
                                <p className="text-xs font-bold text-slate-300">📍 Girón, Santander</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-teal-400 block mb-4">{t('location.badge')}</span>
                            <h2 className="text-3xl font-black text-white mb-6">{t('location.titleStart')}<br /><span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">{t('location.titleHighlight')}</span></h2>
                            <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                                <p>
                                    {t.rich('location.p1', {
                                        highlight: (chunks) => <strong className="text-white">{chunks}</strong>
                                    })}
                                </p>
                                <p>{t('location.p2')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA BANNER ─────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020617 0%, #042f2e 60%, #0c2340 100%)' }}>
                {/* Radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(13,148,136,0.12),transparent)] pointer-events-none" />
                {/* Dot pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                    aria-hidden
                />
                {/* Top accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent" aria-hidden />

                <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-teal-400 text-xs font-black uppercase tracking-widest">{t('cta.badge')}</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        {t('cta.titleStart')}<br />
                        <span className="bg-gradient-to-r from-teal-400 to-sky-400 bg-clip-text text-transparent">{t('cta.titleHighlight')}</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">{t('cta.desc')}</p>

                    <a
                        href="https://wa.me/573223047353"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-500/30"
                    >
                        {t('cta.btn')}
                    </a>
                    <p className="mt-4 text-slate-500 text-sm">{t('cta.footer')}</p>
                </div>
            </section>

        </main>
    );
}
