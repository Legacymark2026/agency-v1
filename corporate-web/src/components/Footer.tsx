import Link from "next/link";
import { ShieldCheck, Mail, Phone, Globe, ArrowUpRight, Lock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#01426F] text-slate-300 border-t border-amber-900/30 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#1E3E62] border border-[#B08A1A]/60 flex items-center justify-center text-[#B08A1A]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-none stroke-current stroke-[2]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span className="text-xl font-black text-white tracking-wider">
                NEO<span className="text-[#B08A1A]">GESTIÓN</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Ecosistema líder de tecnología, consultoría y formación empresarial en Colombia. <strong className="text-slate-200">NeoGestión es un producto de Consultoría de Colombia S.A.S.</strong>, diseñado para transformar la gestión, optimizar procesos y potenciar la rentabilidad organizacional.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#B08A1A] shrink-0" />
                <span>Operación 100% Digital • Cobertura Nacional en Colombia</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B08A1A] shrink-0" />
                <span>contacto@neogestion.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B08A1A] shrink-0" />
                <span>+1 (800) 450-8920</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-200/80">
              <ShieldCheck className="w-4 h-4 text-[#B08A1A]" />
              <span>Gobernanza corporativa, confidencialidad ISO 27001 &amp; SOC 2</span>
            </div>
          </div>

          {/* Soluciones */}
          <div>
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
              Soluciones
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Consultoría Estratégica
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Transformación Digital &amp; Cloud
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Inteligencia de Datos &amp; BI
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Ciberseguridad &amp; Compliance
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Automatización de Procesos
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition-colors">
                  Gestión del Cambio &amp; Liderazgo
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/quienes-somos" className="hover:text-white transition-colors">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link href="/quienes-somos#equipo" className="hover:text-white transition-colors">
                  Equipo Directivo
                </Link>
              </li>
              <li>
                <Link href="/quienes-somos#valores" className="hover:text-white transition-colors">
                  Valores &amp; Filosofía
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Magazine Corporativo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors">
                  Canales de Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Marco Legal */}
          <div>
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-4">
              Marco Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link href="/privacidad#seguridad" className="hover:text-white transition-colors">
                  Seguridad de la Información
                </Link>
              </li>
              <li>
                <Link href="/privacidad#derechos" className="hover:text-white transition-colors">
                  Derechos ARCO / RGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} CONSULTORÍA DE COLOMBIA S.A.S. • NeoGestión es un producto de Consultoría de Colombia S.A.S. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacidad" className="hover:text-slate-300">Privacidad</Link>
            <Link href="/terminos" className="hover:text-slate-300">Términos</Link>
            <Link href="/cookies" className="hover:text-slate-300">Cookies</Link>
            <Link href="/admin/login" className="hover:text-[#D4AF37] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#B08A1A]" />
              <span>Panel Directivo</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
