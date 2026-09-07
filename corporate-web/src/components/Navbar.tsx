"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  Lock, 
  Mail, 
  ChevronDown, 
  ShieldCheck, 
  BarChart3, 
  FileText, 
  Users, 
  ArrowRight,
  Calculator,
  Sparkles
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { LinkedInIcon, InstagramIcon } from "./SocialIcons";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Quiénes Somos", href: "/quienes-somos" },
    { name: "Servicios", href: "/servicios", hasMegaMenu: true },
    { name: "Blog", href: "/blog" },
    { name: "Contacto", href: "/contacto" },
  ];

  const servicesPillars = [
    {
      title: "Sistemas de Gestión",
      subtitle: "ISO 9001, 14001, 45001, SG-SST",
      description: "Auditorías de certificación con cero no-conformidades y matrices integradas.",
      href: "/servicios#sistemas-integrados-gestion",
      icon: ShieldCheck,
      badge: "ISO & HSEQ",
    },
    {
      title: "Procesos, Operaciones & Personas",
      subtitle: "Planear, Gestionar, Controlar, Evaluar",
      description: "Orquestación de flujos de trabajo, metas por colaborador y reducción de cuellos de botella.",
      href: "/servicios#gestion-procesos-operaciones-personas",
      icon: BarChart3,
      badge: "Operaciones",
    },
    {
      title: "Gestión Cero Papel",
      subtitle: "Virtualización & Firmas Válidas",
      description: "Custodia digital segura, correspondencia interna/externa y reducción del 80% en suministros.",
      href: "/servicios#gestion-documental-cero-papel",
      icon: FileText,
      badge: "Sostenible",
    },
    {
      title: "Suite Cloud & Usuarios Ilimitados",
      subtitle: "Sin Costo de Licencia por Usuario",
      description: "Toda su nómina conectada a una sola plataforma sin sobrecostos por cada colaborador nuevo.",
      href: "/servicios#software-usuarios-ilimitados",
      icon: Users,
      badge: "$0 Licencia",
      highlight: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 text-white ${
        scrolled
          ? "bg-[#01426F]/95 backdrop-blur-xl border-b border-[#B08A1A]/40 shadow-2xl"
          : "bg-[#01426F]/95 backdrop-blur-md border-b border-amber-900/30 shadow-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled
              ? "min-h-[4.75rem] sm:min-h-[5.5rem] lg:min-h-[6.5rem] py-1.5 sm:py-2 md:py-2.5"
              : "min-h-[5.5rem] sm:min-h-[6.5rem] lg:min-h-[8.5rem] py-2 sm:py-3 md:py-4"
          }`}
        >
          {/* Logo NEOGESTIÓN Oficial en Gran Formato (2x tamaño responsivo) */}
          <div className="flex items-center shrink-0 max-w-[70%] sm:max-w-[75%] md:max-w-none">
            <BrandLogo 
              variant="dark" 
              size="3xl" 
              showSoftwareTag={true} 
              showCompany={false} 
              className={
                scrolled
                  ? "w-[180px] sm:w-[250px] md:w-[340px] lg:w-[440px] xl:w-[520px] transition-all duration-300"
                  : "w-[200px] sm:w-[280px] md:w-[380px] lg:w-[500px] xl:w-[600px] transition-all duration-300"
              } 
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              if (link.hasMegaMenu) {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setServicesMenuOpen(true)}
                    onMouseLeave={() => setServicesMenuOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
                        active || servicesMenuOpen
                          ? "text-[#D4AF37] bg-amber-500/10 font-bold border border-[#B08A1A]/30"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          servicesMenuOpen ? "rotate-180 text-[#D4AF37]" : "text-slate-400"
                        }`} 
                      />
                    </Link>

                    {/* Interactive Mega-Menu Dropdown */}
                    {servicesMenuOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] pt-3 z-50">
                        <div className="bg-[#051829]/98 backdrop-blur-2xl border border-[#B08A1A]/40 rounded-3xl shadow-2xl p-6 text-white overflow-hidden animate-fadeIn">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                                Arquitectura de Soluciones Integrales
                              </span>
                            </div>
                            <Link 
                              href="/servicios" 
                              className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 font-semibold group"
                            >
                              <span>Ver todos los detalles</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>

                          {/* 4 Pillars Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-5">
                            {servicesPillars.map((pillar, idx) => {
                              const Icon = pillar.icon;
                              return (
                                <Link
                                  key={idx}
                                  href={pillar.href}
                                  className={`p-4 rounded-2xl border transition-all duration-200 group flex flex-col justify-between ${
                                    pillar.highlight
                                      ? "bg-amber-500/10 border-[#B08A1A]/40 hover:bg-amber-500/15 hover:border-[#D4AF37]"
                                      : "bg-slate-900/50 border-slate-800 hover:border-[#B08A1A]/40 hover:bg-slate-900/90"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-[#D4AF37] flex items-center justify-center group-hover:bg-[#B08A1A] group-hover:text-slate-950 transition-colors">
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        {pillar.badge}
                                      </span>
                                    </div>
                                    <div className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                                      {pillar.title}
                                    </div>
                                    <div className="text-xs text-[#D4AF37]/80 font-medium mt-0.5">
                                      {pillar.subtitle}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1.5 leading-snug line-clamp-2">
                                      {pillar.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>

                          {/* Bottom Row inside Mega-Menu */}
                          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40 -mx-6 -mb-6 p-4 px-6 rounded-b-3xl">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                              <span>Diagnóstico de madurez normativa sin costo de evaluación inicial.</span>
                            </div>
                            <Link
                              href="/#calculadora-ahorro"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Calculadora de ROI</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "text-[#D4AF37] bg-amber-500/10 font-bold border border-[#B08A1A]/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Social Links & CTAs */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Direct Social Media & Email Icons */}
            <div className="flex items-center gap-1 border-r border-amber-500/20 pr-2.5">
              <a
                href="https://www.linkedin.com/company/consultoria-de-colombia"
                target="_blank"
                rel="noopener noreferrer"
                title="Perfil Oficial en LinkedIn"
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-[#0A66C2] flex items-center justify-center transition-all"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/neogestion"
                target="_blank"
                rel="noopener noreferrer"
                title="Canal Oficial de Instagram"
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] flex items-center justify-center transition-all"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contacto@neogestion.com"
                title="Enviar Correo: contacto@neogestion.com"
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-[#D4AF37] hover:bg-slate-800 flex items-center justify-center transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>

            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#D4AF37] hover:text-white border border-[#B08A1A]/40 hover:bg-slate-800/80 transition-colors"
              title="Acceso al Panel de Administración"
            >
              <Lock className="w-3.5 h-3.5 text-[#B08A1A]" />
              <span>Panel</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-amber-900/30 bg-[#01426F] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            if (link.hasMegaMenu) {
              return (
                <div key={link.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-base font-semibold ${
                        active
                          ? "bg-amber-500/15 text-[#D4AF37] border border-[#B08A1A]/30"
                          : "text-slate-200 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {link.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                      aria-label="Desplegar servicios"
                    >
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180 text-[#D4AF37]" : ""}`} 
                      />
                    </button>
                  </div>

                  {mobileServicesOpen && (
                    <div className="pl-4 pr-2 py-2 space-y-2 bg-slate-900/60 rounded-xl border border-slate-800 my-1">
                      {servicesPillars.map((pillar, idx) => (
                        <Link
                          key={idx}
                          href={pillar.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <div className="font-bold text-[#D4AF37]">{pillar.title}</div>
                          <div className="text-[11px] text-slate-400">{pillar.subtitle}</div>
                        </Link>
                      ))}
                      <Link
                        href="/#calculadora-ahorro"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-white bg-amber-500/10 border border-[#B08A1A]/40"
                      >
                        <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Calculadora de Retorno de Inversión (ROI)</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-semibold ${
                  active
                    ? "bg-amber-500/15 text-[#D4AF37] border border-[#B08A1A]/30"
                    : "text-slate-200 hover:text-white hover:bg-slate-800"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 space-y-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-[#D4AF37] font-semibold text-sm border border-[#B08A1A]/40"
            >
              <Lock className="w-4 h-4 text-[#B08A1A]" />
              <span>Acceso Panel Directivo</span>
            </Link>

            {/* Redes Sociales en Menú Móvil */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href="https://www.linkedin.com/company/consultoria-de-colombia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/neogestion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contacto@neogestion.com"
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-[#D4AF37] flex items-center justify-center"
                aria-label="Correo Electrónico"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
