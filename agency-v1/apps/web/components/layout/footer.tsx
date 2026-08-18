"use client";

import { Link } from "@/i18n/navigation";
import NextImage from "next/image";
import { siteConfig } from "@/lib/site-config";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLATFORM_VERSION } from "@/lib/version";

// ─── Social Icon Component ─────────────────────────────────────────────────────
interface SocialLinkProps {
    href: string;
    label: string;
    hoverClass: string;
    children: React.ReactNode;
}

function SocialLink({ href, label, hoverClass, children }: SocialLinkProps) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 hover:border-transparent hover:text-white ${hoverClass} hover:shadow-xl`}
        >
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:scale-105">{children}</span>
        </a>
    );
}

// ─── Footer Nav Link ────────────────────────────────────────────────────────────
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="group flex items-center gap-1.5 text-sm text-gray-400 transition-all duration-200 hover:text-white hover:gap-2.5"
            >
                <span className="h-px w-3 bg-gray-600 transition-all duration-200 group-hover:w-5 group-hover:bg-teal-400" />
                {children}
            </Link>
        </li>
    );
}

// ─── Section Heading ────────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
            <span className="h-px w-4 bg-teal-500" />
            {children}
        </h3>
    );
}

// ─── Main Footer ───────────────────────────────────────────────────────────────
export function Footer() {
    const t = useTranslations("footer");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "success" | "loading">("idle");

    async function handleSubscribe(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setStatus("loading");
        // Simulate submit
        await new Promise(r => setTimeout(r, 800));
        setStatus("success");
        setEmail("");
    }

    const year = new Date().getFullYear();

    return (
        <footer className="relative overflow-hidden bg-[#0a0a0f]">

            {/* ── 1. Radial ambient glow (top-left teal orb) ── */}
            <div className="pointer-events-none absolute -left-64 -top-64 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-teal-500/10 to-transparent blur-[130px]" />
            {/* ── 2. Radial ambient glow (bottom-right purple orb) ── */}
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-600/10 to-transparent blur-[110px]" />
            {/* ── 2.5 Center ambient glow (middle soft orb) ── */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/4 blur-[140px]" />

            {/* ── 3. Subtle dot-grid noise pattern ── */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />

            {/* ── 4. Top gradient divider line (animated glow) ── */}
            <div className="relative h-[2px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/40 via-sky-400/60 via-violet-500/40 to-transparent" />
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-teal-400/20 via-sky-300/40 via-violet-400/20 to-transparent" />
            </div>

            {/* ── CTA Banner strip ── */}
            <div className="relative px-4 py-10 md:py-12 border-b border-white/5 bg-gradient-to-r from-teal-950/20 via-slate-900/40 to-violet-950/20">
                {/* Floating Glassmorphic Card Inside */}
                <div className="mx-auto max-w-7xl relative rounded-3xl border border-white/10 bg-white/[0.01] backdrop-blur-md px-6 py-8 md:px-10 md:py-8 shadow-2xl overflow-hidden group/cta">
                    {/* Background glow for the card on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-violet-500/5 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
                        <div>
                            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3.5 py-1 text-xs font-mono font-bold tracking-widest text-teal-400 uppercase ring-1 ring-teal-500/25">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                                {t('ctaBadge')}
                            </span>
                            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl tracking-tight leading-tight">
                                {t('ctaTitleStart')}{" "}
                                <span className="bg-gradient-to-r from-teal-400 via-sky-400 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
                                    {t('ctaTitleHighlight')}
                                </span>
                            </h2>
                        </div>
                        {/* Glowing CTA button */}
                        <Link
                            href="/contacto"
                            className="group relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-sky-500 px-8 py-3.5 text-sm font-black tracking-widest text-white shadow-xl shadow-teal-500/15 hover:shadow-teal-500/35 transition-all duration-300 hover:scale-[1.03] active:scale-95 uppercase font-mono"
                        >
                            <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                            {t('ctaBtn')}
                            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                {/* ── 8. 4-col grid with better spacing ── */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">

                    {/* ── Brand column (wider) ── */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* ── 9. Logo with hover glow ── */}
                        <Link href="/" className="group block w-fit">
                            <div className="relative h-12 w-12 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]">
                                <NextImage
                                    src="/favicon.ico"
                                    alt="LegacyMark"
                                    fill
                                    className="object-contain brightness-0 invert"
                                    sizes="48px"
                                    priority
                                />
                            </div>
                        </Link>

                        {/* ── 10. Tagline with improved typography ── */}
                        <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                            {t('tagline')}
                        </p>

                        {/* ── 11. Address card with glass effect ── */}
                        <div className="space-y-3.5 rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-teal-500/20 hover:bg-slate-900/60 hover:shadow-teal-500/2">
                            <a
                                href={siteConfig.address.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 text-xs text-slate-400 transition-colors hover:text-teal-400 group/address"
                            >
                                {/* ── 12. Icon with teal accent ── */}
                                <div className="mt-0.5 rounded-lg bg-teal-500/10 p-1.5 text-teal-400 transition-colors group-hover/address:bg-teal-500/20">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="leading-relaxed">{siteConfig.address.full}</span>
                            </a>
                            {/* ── 13. NIT with styled badge ── */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-slate-400 ring-1 ring-white/10 shadow-inner">
                                    NIT {siteConfig.nit}
                                </span>
                            </div>
                            {/* ── 14. WhatsApp contact line ── */}
                            <a
                                href={siteConfig.links.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contactar por WhatsApp"
                                className="flex items-center gap-3 text-xs text-slate-400 transition-colors hover:text-[#25D366] group/wa"
                            >
                                <div className="rounded-lg bg-[#25D366]/10 p-1.5 text-[#25D366] transition-colors group-hover/wa:bg-[#25D366]/20">
                                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <span className="font-semibold">+57 322 304 7353</span>
                            </a>
                        </div>

                        {/* ── 15. Social icons with branded hover + scale ── */}
                        <div className="flex items-center gap-3 pt-1">
                            <SocialLink href={siteConfig.links.facebook} label="Facebook" hoverClass="hover:bg-[#1877F2] hover:shadow-[#1877F2]/40 hover:border-[#1877F2]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.instagram} label="Instagram" hoverClass="hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:shadow-[#FD1D1D]/45">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.linkedin} label="LinkedIn" hoverClass="hover:bg-[#0077B5] hover:shadow-[#0077B5]/40 hover:border-[#0077B5]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.whatsapp} label="WhatsApp" hoverClass="hover:bg-[#25D366] hover:shadow-[#25D366]/40 hover:border-[#25D366]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            </SocialLink>
                        </div>
                    </div>

                    {/* ── Services ── */}
                    <div className="lg:col-span-2">
                        <SectionHeading>{t('services')}</SectionHeading>
                        {/* ── 16. Animated underline on hover links ── */}
                        <ul className="space-y-2.5">
                            <FooterLink href="/soluciones/estrategia-de-marca">{t('links.strategy')}</FooterLink>
                            <FooterLink href="/soluciones/creacion-contenido">{t('links.content')}</FooterLink>
                            <FooterLink href="/soluciones/automatizacion">{t('links.automation')}</FooterLink>
                            <FooterLink href="/soluciones/web-dev">{t('links.webdev')}</FooterLink>
                            <FooterLink href="/flyering">{t('links.flyering')}</FooterLink>
                        </ul>
                    </div>

                    {/* ── Company ── */}
                    <div className="lg:col-span-2">
                        <SectionHeading>{t('company')}</SectionHeading>
                        <ul className="space-y-2.5">
                            <FooterLink href="/nosotros">{t('links.about')}</FooterLink>
                            <FooterLink href="/metodologia">{t('links.methodology')}</FooterLink>
                            <FooterLink href="/portfolio">{t('links.portfolio')}</FooterLink>
                            <FooterLink href="/blog">{t('links.blog')}</FooterLink>
                            <FooterLink href="/contacto">{t('links.contact')}</FooterLink>
                        </ul>
                    </div>

                    {/* ── Newsletter ── */}
                    <div className="lg:col-span-4">
                        <SectionHeading>{t('newsletter')}</SectionHeading>
                        {/* ── 17. Improved newsletter description ── */}
                        <p className="mb-5 text-sm leading-relaxed text-gray-400">
                            {t('newsletterDesc')}
                        </p>

                        {status === "success" ? (
                            /* ── 18. Success state with animated checkmark ── */
                            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-400 shadow-xl backdrop-blur-md font-medium">
                                <svg className="h-5 w-5 flex-shrink-0 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('subscribeSuccess')}
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe}>
                                {/* ── 19. Floating-label-style input ── */}
                                <div className="relative mb-3 group/input">
                                    <label htmlFor="newsletter-email" className="sr-only">{t('email')}</label>
                                    <input
                                        type="email"
                                        id="newsletter-email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t('email')}
                                        required
                                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3.5 pr-32 text-sm text-white placeholder-gray-500 backdrop-blur-md transition-all duration-300 focus:border-teal-500/80 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                                    />
                                    {/* ── 20. Inline submit button inside input ── */}
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 hover:from-teal-400 hover:to-teal-500 disabled:opacity-60 shadow-md font-mono"
                                    >
                                        {status === "loading" ? t('subscribeLoading') : t('subscribe')}
                                    </button>
                                </div>
                                {/* ── 21. Privacy consent styled ── */}
                                <label htmlFor="newsletter-consent" className="flex cursor-pointer items-start gap-2.5">
                                    <div className="relative mt-0.5 flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            id="newsletter-consent"
                                            required
                                            className="peer h-3.5 w-3.5 cursor-pointer appearance-none rounded-sm border border-white/20 bg-white/5 transition-colors checked:border-teal-500 checked:bg-teal-500"
                                        />
                                        <svg className="pointer-events-none absolute inset-0 h-3.5 w-3.5 scale-0 text-white transition-transform peer-checked:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs leading-relaxed text-slate-400">
                                        {t('privacyConsent')} <Link href="/politica-privacidad" className="text-teal-500 underline-offset-2 hover:underline">
                                            {t('privacyPolicy')}
                                        </Link>
                                    </span>
                                </label>
                            </form>
                        )}

                        {/* ── 22. Trust badges row ── */}
                        <div className="mt-6 flex items-center gap-4 border-t border-white/6 pt-5">
                            {[
                                { icon: "🔒", label: t('trust.secure') },
                                { icon: "✉️", label: t('trust.noSpam') },
                                { icon: "🚫", label: t('trust.cancelFree') },
                            ].map(b => (
                                <div key={b.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span>{b.icon}</span>
                                    <span>{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── 23. Divider with gradient fade ── */}
                <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* ── Bottom bar ── */}
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                    {/* ── 24. Copyright with year + entity name + version badge ── */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-center text-xs text-slate-400 sm:text-left">
                        <p>
                            © {year}{" "}
                            <span className="font-semibold text-slate-300">LegacyMark SAS</span>
                            {" "}— {t('rightsEnd')}{" "}
                            <span className="text-slate-400">NIT {siteConfig.nit}</span>
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-teal-500/30 text-[10px] font-mono text-teal-400" title={`Release: ${PLATFORM_VERSION.releaseName} | Build: ${PLATFORM_VERSION.buildNumber}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            {PLATFORM_VERSION.version}
                        </span>
                    </div>

                    {/* ── 25. Legal links with separators ── */}
                    <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-xs text-gray-600">
                        {[
                            { href: "/politica-privacidad", label: t('privacy') },
                            { href: "/terms", label: t('terms') },
                            { href: "/politica-cookies", label: t('cookies') },
                            { href: "/sitemap", label: t('sitemap') },
                        ].map((l, i) => (
                            <span key={l.href} className="flex items-center gap-x-1">
                                {i > 0 && <span className="text-gray-700">·</span>}
                                <Link href={l.href} className="transition-colors hover:text-teal-400">
                                    {l.label}
                                </Link>
                            </span>
                        ))}
                    </nav>

                    {/* ── 26. "Made with ❤️" badge ── */}
                    <p className="hidden text-xs text-gray-700 lg:block">
                        {t('madeWithLove')}
                    </p>
                </div>
            </div>

            {/* ── 27. Bottom edge glow line ── */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-teal-600/30 to-transparent" />

            {/* ── 28. Floating Colombia flag badge ── */}
            <div className="absolute bottom-14 right-4 hidden lg:block transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-slate-400 backdrop-blur-md shadow-lg shadow-black/10 hover:text-slate-300">
                    <span className="text-sm">🇨🇴</span> <span>{t('country')}</span>
                </div>
            </div>
        </footer>
    );
}
