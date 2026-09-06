import type { Metadata } from "next";
import { Mail, Phone, Globe, MessageCircle, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contacto Directivo | NEOGESTIÓN",
  description:
    "Canales directos de comunicación para comités ejecutivos y alta dirección con los especialistas de NEOGESTIÓN, un producto de Consultoría de Colombia S.A.S.",
};

export default function ContactoPage() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      {/* Banner */}
      <section className="bg-[#0B192C] text-white py-20 lg:py-28 relative overflow-hidden">
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
              <div className="bg-[#0B192C] text-white p-8 rounded-3xl border border-[#B08A1A]/40 shadow-xl gold-border-slide">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      Respuesta Inmediata
                    </span>
                    <h3 className="text-lg font-bold text-white">Canal WhatsApp Directivo</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                  Conéctese directamente con el equipo de coordinación para coordinar reuniones urgentes o requerimientos inmediatos.
                </p>
                <a
                  href="https://wa.me/18004508920?text=Hola%2C%20quisiera%20agendar%20una%20sesi%C3%B3n%20con%20los%20directores%20de%20NEOGESTI%C3%93N."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir Chat de WhatsApp</span>
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
            </div>

            {/* Formulario de Conversión */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>

          {/* Mapa Interactivo con Integración Visual */}
          <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
                  Localización Física
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Sede Central NEOGESTIÓN
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Acceso ejecutivo privado con estacionamiento reservado
              </span>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200">
              <iframe
                title="Sede Corporativa NEOGESTIÓN"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.790906915234!2d-74.058319!3d4.666708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9a5f33333333%3A0x123456789abcdef!2sCentro%20Financiero!5e0!3m2!1ses!2ses!4v1680000000000!5m2!1ses!2ses"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
