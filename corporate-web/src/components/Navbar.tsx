"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, MessageCircle, Lock } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Quiénes Somos", href: "/quienes-somos" },
    { name: "Servicios", href: "/servicios" },
    { name: "Blog", href: "/blog" },
    { name: "Contacto", href: "/contacto" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#01426F]/95 backdrop-blur-md border-b border-amber-900/30 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5.5rem] py-2">
          {/* Logo NEOGESTIÓN Oficial - 2x más grande */}
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo 
              variant="dark" 
              size="2xl" 
              showSoftwareTag={true} 
              showCompany={true} 
              className="w-[185px] sm:w-[235px] md:w-[275px] lg:w-[310px]" 
            />
            {/* Strategic Product Badge Chip */}
            <div className="hidden 2xl:flex flex-col border-l border-amber-500/25 pl-3 py-0.5 select-none">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]">Producto Insignia</span>
              <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">Suite Cloud Oficial</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
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

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#D4AF37] hover:text-white border border-[#B08A1A]/40 hover:bg-slate-800/80 transition-colors"
              title="Acceso al Panel de Administración"
            >
              <Lock className="w-3.5 h-3.5 text-[#B08A1A]" />
              <span>Panel Directivo</span>
            </Link>
            <a
              href="https://wa.me/18004508920?text=Hola%2C%20quisiera%20solicitar%20informaci%C3%B3n%20sobre%20sus%20servicios%20de%20NEOGESTI%C3%93N."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-bold border border-emerald-500/40 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 text-sm font-bold hover:brightness-110 transition-all gold-glow"
            >
              <span>Solicitar Consulta</span>
              <ArrowRight className="w-4 h-4" />
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
            <a
              href="https://wa.me/18004508920"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 text-emerald-300 font-semibold text-sm border border-emerald-500/40"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Contactar por WhatsApp</span>
            </a>
            <Link
              href="/contacto"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-bold text-sm"
            >
              <span>Solicitar Consulta Estratégica</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
