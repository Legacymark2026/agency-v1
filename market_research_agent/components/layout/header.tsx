"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useTranslations } from "next-intl";
import { UserRole } from "@/types/auth";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/search/global-search";

const DARK_BG_PAGES = ["/", "/flyering", "/contacto", "/blog", "/nosotros", "/metodologia", "/portfolio", "/vip", "/tarifario"];

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
        { name: tFooter("strategy") === "Brand Strategy" ? "Home" : "Inicio", href: "/" }, // Hardcoding a bit based on current English string absence for "Inicio" in nav. Better to use existing ones or fallback. Wait, let's just use what's available.
        { name: tFooter("strategy") === "Brand Strategy" ? "About Us" : "Nosotros", href: "/nosotros" },
        {
            name: t("services"),
            href: "#",
            submenu: [
                { name: tFooter("content"), href: "/soluciones/creacion-contenido" },
                { name: tFooter("marketing"), href: "/soluciones/estrategia" },
                { name: tFooter("strategy"), href: "/soluciones/estrategia-de-marca" },
                { name: tFooter("design") === "Design & Creativity" ? "Automation AI" : "Automatización IA", href: "/soluciones/automatizacion" }, // Need proper keys for these
                { name: tFooter("design") === "Design & Creativity" ? "Web Dev" : "Desarrollo Web", href: "/soluciones/web-dev" },
                { name: tFooter("marketing"), href: "/servicios" },
                { name: tFooter("flyering"), href: "/flyering" }
            ]
        },
        { name: t("portfolio"), href: "/portfolio" },
        { name: t("methodology"), href: "/metodologia" },
        { name: "Tarifario", href: "/tarifario" },
        { name: t("blog"), href: "/blog" },
        { name: t("contact"), href: "/contacto" },
    ];

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-10 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${isScrolled
                ? "bg-white/80 backdrop-blur-lg border-b border-gray-200/50 py-2 shadow-sm"
                : "bg-transparent border-transparent py-4 md:py-6"
                }`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo — white on dark pages, original on white header */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative h-[62px] w-[260px] sm:h-[73px] sm:w-[364px] transition-all duration-300 ease-out group-hover:scale-105">
                        <Image
                            src="/logo.png"
                            alt="LegacyMark"
                            fill
                            className="object-contain transition-all duration-500"
                            style={logoIsWhite ? { filter: "brightness(0) invert(1)" } : {}}
                            priority
                        />
                    </div>
                </Link>

                {/* Global Search */}
                <div className="hidden lg:block flex-1 max-w-md mx-8">
                    <GlobalSearch />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <div
                            key={link.name}
                            className="relative"
                            onMouseEnter={() => setHoveredLink(link.name)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            <Link
                                href={link.href}
                                className={`flex items-center gap-1 text-sm font-medium transition-colors ${isScrolled
                                        ? "text-slate-600 hover:text-teal-600"
                                        : isDarkPage
                                            ? "text-slate-200 hover:text-teal-400"
                                            : "text-slate-800 hover:text-teal-600"
                                    }`}
                            >
                                {link.name}
                                {link.submenu && <ChevronDown size={14} />}
                            </Link>

                            {/* Simple Dropdown */}
                            {link.submenu && hoveredLink === link.name && (
                                <div className="absolute top-full left-0 pt-4 w-56">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden p-1"
                                    >
                                        {link.submenu.map(sub => (
                                            <Link
                                                key={sub.name}
                                                href={sub.href}
                                                className="block px-4 py-3 rounded-lg text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium"
                                            >
                                                {sub.name}
                                            </Link>
                                        ))}
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    ))}
                    <LanguageSwitcher />
                    {session ? (
                        <Link href="/dashboard">
                            <Button size="sm" className="rounded-full px-4 lg:px-6 shadow-lg hover:shadow-xl transition-all bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap">
                                <LayoutDashboard size={15} className="shrink-0" />
                                <span className="hidden xl:block whitespace-nowrap">{isAgency ? 'Panel de Control' : 'Portal Cliente'}</span>
                                <span className="block xl:hidden whitespace-nowrap">{isAgency ? 'Panel' : 'Portal'}</span>
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/contacto">
                            <Button size="sm" className={`rounded-full px-6 shadow-lg hover:shadow-xl transition-all ${isScrolled ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-900 text-white hover:bg-slate-800"
                                }`}>
                                Transforma tu marca
                            </Button>
                        </Link>
                    )}
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className={`md:hidden transition-colors ${isScrolled ? "text-slate-900" : isDarkPage ? "text-white" : "text-slate-900"}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b border-gray-200 bg-white absolute top-full left-0 right-0 shadow-xl"
                    >
                        <div className="flex flex-col gap-4 p-6">
                            {navLinks.map((link) => (
                                <div key={link.name}>
                                    {link.submenu ? (
                                        <div className="space-y-2">
                                            <div className="font-bold text-slate-900 text-lg">{link.name}</div>
                                            <div className="pl-4 space-y-2 border-l-2 border-teal-100 ml-1">
                                                {link.submenu.map(sub => (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className="block text-base font-medium text-slate-600 active:text-teal-600"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            className="block text-lg font-bold text-slate-800 hover:text-teal-600"
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
                                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-12 rounded-full text-base bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center gap-2">
                                            <LayoutDashboard size={18} className="shrink-0" />
                                            {isAgency ? 'Panel de Control' : 'Portal Cliente'}
                                        </Button>
                                    </Link>
                                )}
                                <Link href="/contacto" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-12 rounded-full text-lg bg-slate-900 text-white">
                                        Transforma tu marca
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
