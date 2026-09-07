"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Lock, Mail } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { LinkedInIcon, InstagramIcon } from "./SocialIcons";

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
        <div className="flex items-center justify-between min-h-[5.5rem] sm:min-h-[6.5rem] lg:min-h-[8.5rem] py-2 sm:py-3 md:py-4">
          {/* Logo NEOGESTIÓN Oficial en Gran Formato (2x tamaño) */}
          <div className="flex items-center shrink-0 max-w-[70%] sm:max-w-[75%] md:max-w-none">
            <BrandLogo 
              variant="dark" 
              size="3xl" 
              showSoftwareTag={true} 
              showCompany={false} 
              className="w-[200px] sm:w-[280px] md:w-[380px] lg:w-[500px] xl:w-[600px]" 
            />
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
