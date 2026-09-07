import type { Metadata } from "next";
import { Mail, Phone, Globe, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import ContactForm from "./ContactForm";
import { WhatsAppIcon, LinkedInIcon, InstagramIcon } from "@/components/SocialIcons";

export const metadata: Metadata = {
  title: "Contacto Directivo | NEOGESTIÓN",
  description:
    "Canales directos de comunicación para comités ejecutivos y alta dirección con los especialistas de NEOGESTIÓN, un producto de Consultoría de Colombia S.A.S.",
};

export default function ContactoPage() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Banner */}
      <section className="bg-[#01426F] text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(176,138,26,0.22),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            Canal de Conversión Directiva
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight font-sans">
            Iniciemos la Conversación Estratégica
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Atención prioritaria y reservada para comités de administración, CEOs y directores de línea.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Canales y Datos de Contacto con Borde Inferior Dorado */}
            <div className="lg:col-span-5 space-y-8">
              {/* WhatsApp Box */}
              <div className="bg-[#01426F] text-white p-8 rounded-3xl border border-[#B08A1A]/40 shadow-xl gold-border-slide">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-950/40">
                    <WhatsAppIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      Respuesta Inmediata &lt;10 min
                    </span>
                    <h3 className="text-lg font-bold text-white">Línea Oficial WhatsApp</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                  Conéctese directamente con el equipo directivo de <strong>Consultoría de Colombia S.A.S. / NeoGestión</strong> para coordinar demostraciones en vivo o requerimientos urgentes.
                </p>
                <a
                  href="https://wa.me/18004508920?text=Hola%2C%20quisiera%20agendar%20una%20sesi%C3%B3n%20con%20los%20directores%20de%20NEOGESTI%C3%93N."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs hover:brightness-110 transition-all shadow-md"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Abrir Chat Directo de WhatsApp</span>
                </a>
              </div>

              {/* Tarjetas de Canales con Borde Dorado Deslizante */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Canales &amp; Atención Institucional
                </h3>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 gold-border-slide">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Operación 100% Digital</h4>
                    <p className="text-xs text-slate-600">Cobertura Nacional en Colombia</p>
                    <p className="text-[11px] text-slate-400">Consultoría de Colombia S.A.S. • Soporte Remoto</p>
                  </div>
                </div>


                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 gold-border-slide">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Correo Electrónico</h4>
                    <p className="text-xs text-slate-600">contacto@neogestion.com</p>
                    <p className="text-[11px] text-slate-400">directorio@neogestion.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 gold-border-slide">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Conmutador Internacional</h4>
                    <p className="text-xs text-slate-600">+1 (800) 450-8920 (Directo)</p>
                    <p className="text-[11px] text-slate-400">Atención de Lunes a Viernes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 gold-border-slide">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#B08A1A] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Tiempo de Respuesta</h4>
                    <p className="text-xs text-slate-600">Menos de 24 horas garantizado</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">Prioridad a directores</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-[#B08A1A]" />
                  <span>Tratamiento de información confidencial ISO 27001</span>
                </div>
              </div>

              {/* Redes Sociales Oficiales */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                  Redes Sociales &amp; Comunidad Directiva
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="https://www.linkedin.com/company/consultoria-de-colombia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-[#0A66C2] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0A66C2] transition-all text-xs font-bold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shrink-0">
                      <LinkedInIcon className="w-4 h-4" />
                    </div>
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="https://www.instagram.com/neogestion"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all text-xs font-bold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Formulario de Conversión */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>

          {/* Cobertura Nacional 100% Digital */}
          <div className="mt-16 bg-[#01426F] text-white rounded-3xl border border-[#B08A1A]/40 p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(176,138,26,0.18),transparent)] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/15 border border-[#B08A1A]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
                  Operación 100% Digital • Consultoría de Colombia S.A.S.
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  Cobertura Empresarial en Toda Colombia
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  NeoGestión es una plataforma tecnológica desarrollada por <strong>Consultoría de Colombia S.A.S.</strong> Operamos de forma completamente digital y en la nube, brindando soporte técnico, consultorías estratégicas y sesiones directivas remotas a organizaciones de todo el país.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-[#D4AF37] font-bold text-lg block">100% Virtual</span>
                  <span className="text-xs text-slate-300">Sesiones directivas por videoconferencia</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-[#D4AF37] font-bold text-lg block">Nube Segura</span>
                  <span className="text-xs text-slate-300">Acceso ininterrumpido 24/7 sin sedes físicas</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
