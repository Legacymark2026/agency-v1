"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslations } from "next-intl";
import { UserRole } from "@/types/auth";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/search/global-search";

const DARK_BG_PAGES = ["/", "/flyering", "/contacto", "/blog", "/nosotros", "/metodologia", "/portfolio", "/vip", "/tarifario", "/suscripcion"];

interface NavLink {
    name: string;
    href: string;
    submenu?: { name: string; href: string }[];
}

// We will generate navLinks inside the component so we can use the translation hook.

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();

    // Strip locale prefix (e.g. /es/contacto → /contacto)
    const cleanPath = "/" + (pathname?.split("/").slice(2).join("/") || "");
    const isDarkPage = DARK_BG_PAGES.some(p => cleanPath === p || cleanPath.startsWith(p + "/"));
    // Logo is white when on a dark page AND the header hasn't scrolled yet (still transparent)
    const logoIsWhite = isDarkPage && !isScrolled;
    const t = useTranslations("nav");
    const tFooter = useTranslations("footer.links");

    const isAgency = session?.user?.role && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(session.user.role as UserRole);

    const navLinks: NavLink[] = [
        { name: tFooter("strategy") === "Brand Strategy" ? "Home" : "Inicio", href: "/" },
        { name: tFooter("strategy") === "Brand Strategy" ? "About Us" : "Nosotros", href: "/nosotros" },
        {
            name: t("services"),
            href: "#",
            submenu: [
                { name: tFooter("content"), href: "/soluciones/creacion-contenido" },
                { name: tFooter("marketing"), href: "/soluciones/estrategia" },
                { name: tFooter("strategy"), href: "/soluciones/estrategia-de-marca" },
                { name: tFooter("design") === "Design & Creativity" ? "Automation AI" : "Automatización IA", href: "/soluciones/automatizacion" },
                { name: tFooter("design") === "Design & Creativity" ? "Web Dev" : "Desarrollo Web", href: "/soluciones/web-dev" },
                { name: tFooter("flyering"), href: "/flyering" }
            ]
        },
        { name: t("portfolio"), href: "/portfolio" },
        {
            name: t("recursos"),
            href: "#",
            submenu: [
                { name: t("methodology"), href: "/metodologia" },
                { name: "Tarifario", href: "/tarifario" },
                { name: "Planes", href: "/suscripcion" },
                { name: t("blog"), href: "/blog" },
            ]
        },
        { name: t("contact"), href: "/contacto" },
    ];

    // Handle scroll effect
    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent hydration mismatch by returning a simplified skeleton that matches the final layout metrics
    if (!mounted) {
        return (
            <header className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 rounded-full bg-transparent border border-transparent" />
            </header>
        );
    }

    return (
        <header
            className={`fixed top-6 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 md:px-8`}
        >
            <div className={`mx-auto flex h-16 max-w-7xl items-center justify-between px-6 rounded-full transition-all duration-500 ${isScrolled
                ? "bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                : "bg-transparent border-transparent"
                }`}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="relative h-10 w-[140px] sm:h-12 sm:w-[160px] lg:h-14 lg:w-[180px] transition-all duration-300 ease-out group-hover:scale-105">
                        <Image
                            src="/logo.png"
                            alt="LegacyMark"
                            fill
                            className="object-contain transition-all duration-500"
                            style={isScrolled || isDarkPage ? { filter: "brightness(0) invert(1)" } : {}}
                            priority
                        />
                    </div>
                </Link>

                {/* Global Search */}
                <div className="hidden lg:flex items-center w-48 xl:w-56 shrink-0 mx-4">
                    <GlobalSearch />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center lg:gap-3 xl:gap-6 shrink-0">
                    {navLinks.map((link) => (
                        <div
                            key={link.name}
                            className="relative"
                            onMouseEnter={() => setHoveredLink(link.name)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            {link.submenu ? (
                                <div
                                    className={`flex cursor-default items-center gap-1 text-[13px] font-bold transition-all duration-300 tracking-tight uppercase font-mono ${isScrolled || isDarkPage
                                            ? "text-slate-400 hover:text-teal-400"
                                            : "text-slate-700 hover:text-teal-600"
                                        }`}
                                >
                                    {link.name}
                                    <ChevronDown size={12} className={`transition-transform duration-300 ${hoveredLink === link.name ? 'rotate-180 text-teal-500' : ''}`} />
                                </div>
                            ) : (
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-1 text-[13px] font-bold transition-all duration-300 tracking-tight uppercase font-mono ${isScrolled || isDarkPage
                                            ? "text-slate-400 hover:text-teal-400"
                                            : "text-slate-700 hover:text-teal-600"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            )}

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {link.submenu && hoveredLink === link.name && (
                                    <div className="absolute top-full left-0 pt-4 w-64">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="bg-slate-950/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden p-2"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
                                            {link.submenu.map(sub => (
                                                <Link
                                                    key={sub.name}
                                                    href={sub.href}
                                                    className="relative block px-4 py-3 rounded-xl text-xs text-slate-400 hover:bg-white/5 hover:text-teal-400 transition-all duration-200 font-mono tracking-tight uppercase group/item"
                                                >
                                                    <span className="relative z-10 flex items-center justify-between">
                                                        {sub.name}
                                                        <ArrowUpRight size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    </span>
                                                </Link>
                                            ))}
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <LanguageSwitcher />
                    {session ? (
                        <a href="/dashboard">
                            <Button size="sm" className="rounded-full px-4 lg:px-6 shadow-lg hover:shadow-xl transition-all bg-teal-600 text-slate-950 font-bold font-mono text-xs tracking-widest hover:bg-teal-500 flex items-center gap-2 whitespace-nowrap">
                                <LayoutDashboard size={14} className="shrink-0" />
                                <span className="hidden xl:block whitespace-nowrap uppercase">{isAgency ? 'Control' : 'Portal'}</span>
                                <span className="block xl:hidden whitespace-nowrap">GO</span>
                            </Button>
                        </a>
                    ) : (
                        <Link href="/contacto">
                            <Button size="sm" className="rounded-full px-5 shadow-lg hover:shadow-teal-500/20 transition-all bg-white text-slate-950 font-bold font-mono text-xs tracking-widest hover:bg-teal-400">
                                START
                            </Button>
                        </Link>
                    )}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
                    aria-expanded={isOpen}
                    className={`lg:hidden transition-colors ${isScrolled ? "text-slate-900" : isDarkPage ? "text-white" : "text-slate-900"}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-b border-white/5 bg-slate-950/95 backdrop-blur-2xl absolute top-full left-0 right-0 shadow-2xl"
                    >
                        <div className="flex flex-col gap-4 p-6">
                            {navLinks.map((link) => (
                                <div key={link.name}>
                                    {link.submenu ? (
                                        <div className="space-y-2">
                                            <div className="font-bold text-slate-200 text-lg font-mono uppercase tracking-tighter">{link.name}</div>
                                            <div className="pl-4 space-y-2 border-l-2 border-teal-500/20 ml-1">
                                                {link.submenu.map(sub => (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className="flex items-center justify-between text-base font-medium text-slate-400 active:text-teal-400"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {sub.name}
                                                        <ArrowUpRight size={14} className="text-teal-500/50" />
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="block text-lg font-bold text-slate-200 hover:text-teal-400 font-mono uppercase tracking-tighter"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            <div className="pt-4 space-y-3">
                                <div className="flex justify-center">
                                    <LanguageSwitcher />
                                </div>
                                {session && (
                                    <a href="/dashboard" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-12 rounded-full text-base bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center gap-2">
                                            <LayoutDashboard size={18} className="shrink-0" />
                                            {isAgency ? 'Panel de Control' : 'Portal Cliente'}
                                        </Button>
                                    </a>
                                )}
                                <Link href="/contacto" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-12 rounded-full text-lg bg-white text-slate-950 font-bold font-mono tracking-widest hover:bg-teal-400">
                                        START PROJECT
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
