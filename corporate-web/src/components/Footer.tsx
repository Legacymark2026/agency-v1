import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Mail, Phone, Globe, ArrowUpRight, Lock } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { WhatsAppIcon, LinkedInIcon, InstagramIcon } from "./SocialIcons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#01426F] text-slate-300 border-t border-amber-900/30 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="3xl" showSoftwareTag={true} showCompany={false} className="w-[260px] sm:w-[380px] md:w-[480px]" />
            
            {/* Logo Oficial Empresa Matriz: Consultoría de Colombia Ltda. (Mesa de trabajo 9 copia 3.svg) */}
            <div className="p-3.5 rounded-2xl bg-white/95 border border-[#B08A1A]/40 shadow-md inline-block max-w-[320px] sm:max-w-[360px]">
              <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B08A1A]" />
                <span>Empresa Matriz &amp; Respaldo Institucional:</span>
              </div>
              <Image 
                src="/brand/Mesa%20de%20trabajo%209%20copia%203.svg" 
                alt="Consultoría de Colombia Ltda."
                width={820}
                height={312}
                className="w-full h-auto max-h-[56px] sm:max-h-[64px] object-contain"
              />
            </div>

            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Ecosistema líder de tecnología, consultoría y formación empresarial en Colombia. Diseñado para transformar la gestión, optimizar procesos y potenciar la rentabilidad organizacional con filosofía Cero Papel y usuarios ilimitados.
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

            {/* Redes Sociales Oficiales */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider block mb-2.5">
                Redes Directivas &amp; Canales Oficiales:
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.linkedin.com/company/consultoria-de-colombia"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Perfil Oficial en LinkedIn"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#0A66C2] text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-sm group"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/neogestion"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Canal Oficial en Instagram"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-all shadow-sm group"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href="mailto:contacto@neogestion.com"
                  title="Escribir por Correo Electrónico"
                  className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-[#01426F] hover:text-[#D4AF37] text-slate-300 border border-slate-700/60 flex items-center justify-center transition-all shadow-sm group"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/18004508920"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat Oficial por WhatsApp"
                  className="w-9 h-9 rounded-xl bg-emerald-950/70 hover:bg-[#25D366] text-emerald-400 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all shadow-sm group"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
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
