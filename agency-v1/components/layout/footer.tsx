"use client";

import Link from "next/link";
import NextImage from "next/image";
import { siteConfig } from "@/lib/site-config";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
            className={`group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-transparent hover:text-white ${hoverClass} hover:shadow-lg`}
        >
            <span aria-hidden="true">{children}</span>
            <span className="sr-only">{label}</span>
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
            <div className="pointer-events-none absolute -left-64 -top-64 h-[600px] w-[600px] rounded-full bg-teal-500/8 blur-[120px]" />
            {/* ── 2. Radial ambient glow (bottom-right purple orb) ── */}
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/8 blur-[100px]" />

            {/* ── 3. Subtle dot-grid noise pattern ── */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                }}
            />

            {/* ── 4. Top gradient divider line (animated glow) ── */}
            <div className="relative h-px w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
            </div>

            {/* ── CTA Banner strip ── */}
            <div className="relative border-b border-white/5 bg-gradient-to-r from-teal-600/15 via-teal-500/10 to-violet-600/15 px-4 py-8">
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
                    {/* ── 5. Badge chip on CTA strip ── */}
                    <div>
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-400 ring-1 ring-teal-500/30">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                            {t('ctaBadge')}
                        </span>
                        {/* ── 6. Gradient headline text ── */}
                        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                            {t('ctaTitleStart')}
                            <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">
                                {t('ctaTitleHighlight')}
                            </span>
                        </h2>
                    </div>
                    {/* ── 7. Glowing CTA button ── */}
                    <Link
                        href="/contacto"
                        className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:scale-105 hover:shadow-teal-500/40 hover:shadow-xl"
                    >
                        <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                        {t('ctaBtn')}
                        <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
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
                            <div className="relative h-16 w-[220px] transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(20,184,166,0.4)]">
                                <NextImage
                                    src="/logo.png"
                                    alt="LegacyMark"
                                    fill
                                    className="object-contain brightness-0 invert"
                                    sizes="220px"
                                    priority
                                />
                            </div>
                        </Link>

                        {/* ── 10. Tagline with improved typography ── */}
                        <p className="max-w-xs text-sm leading-relaxed text-gray-400">
                            {t('tagline')}
                        </p>

                        {/* ── 11. Address card with glass effect ── */}
                        <div className="space-y-2.5 rounded-xl border border-white/8 bg-white/4 p-4 backdrop-blur-sm">
                            <a
                                href={siteConfig.address.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-2.5 text-xs text-gray-400 transition-colors hover:text-teal-400"
                            >
                                {/* ── 12. Icon with teal accent ── */}
                                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{siteConfig.address.full}</span>
                            </a>
                            {/* ── 13. NIT with styled badge ── */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-md bg-white/8 px-2 py-0.5 font-mono text-gray-400 ring-1 ring-white/10">
                                    NIT {siteConfig.nit}
                                </span>
                            </div>
                            {/* ── 14. WhatsApp contact line ── */}
                            <a
                                href={siteConfig.links.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Contactar por WhatsApp"
                                className="flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-[#25D366]"
                            >
                                <svg className="h-3.5 w-3.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                +57 322 304 7353
                            </a>
                        </div>

                        {/* ── 15. Social icons with branded hover + scale ── */}
                        <div className="flex items-center gap-2.5 pt-1">
                            <SocialLink href={siteConfig.links.facebook} label="Facebook" hoverClass="hover:bg-[#1877F2] hover:shadow-[#1877F2]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.instagram} label="Instagram" hoverClass="hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:shadow-[#FD1D1D]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.linkedin} label="LinkedIn" hoverClass="hover:bg-[#0077B5] hover:shadow-[#0077B5]/30">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            </SocialLink>
                            <SocialLink href={siteConfig.links.whatsapp} label="WhatsApp" hoverClass="hover:bg-[#25D366] hover:shadow-[#25D366]/30">
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
                            <div className="flex items-center gap-3 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-400">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('subscribeSuccess')}
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe}>
                                {/* ── 19. Floating-label-style input ── */}
                                <div className="relative mb-3">
                                    <label htmlFor="newsletter-email" className="sr-only">{t('email')}</label>
                                    <input
                                        type="email"
                                        id="newsletter-email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder={t('email')}
                                        required
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-32 text-sm text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:border-teal-500/60 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                                    />
                                    {/* ── 20. Inline submit button inside input ── */}
                                    <button
                                        type="submit"
                                        disabled={status === "loading"}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-teal-400 disabled:opacity-60"
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
                                    <span className="text-xs leading-relaxed text-gray-500">
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
                    {/* ── 24. Copyright with year + entity name styled ── */}
                    <p className="text-center text-xs text-gray-600 sm:text-left">
                        © {year}{" "}
                        <span className="font-semibold text-gray-400">LegacyMark SAS</span>
                        {" "}— {t('rightsEnd')}{" "}
                        <span className="text-gray-600">NIT {siteConfig.nit}</span>
                    </p>

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
            <div className="absolute bottom-14 right-4 hidden lg:block">
                <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-gray-500 backdrop-blur-sm">
                    🇨🇴 <span>{t('country')}</span>
                </div>
            </div>
        </footer>
    );
}
