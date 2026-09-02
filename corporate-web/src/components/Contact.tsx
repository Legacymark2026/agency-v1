"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "Consultoría Estratégica",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contacto" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Information */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-2">
              Contacto Corporativo
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Inicie la conversación estratégica con nuestros directores
            </h2>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Descubra cómo nuestras soluciones a medida pueden potenciar el rendimiento y blindar el futuro de su empresa.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Sede Central</h4>
                  <p className="text-sm text-slate-400">Torre Empresarial Vanguardia, Nivel 28</p>
                  <p className="text-xs text-slate-500">Distrito Financiero Internacional</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Atención Institucional</h4>
                  <p className="text-sm text-slate-400">contacto@vanguardiacorp.com</p>
                  <p className="text-xs text-slate-500">investors@vanguardiacorp.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Línea Directa Directiva</h4>
                  <p className="text-sm text-slate-400">+1 (800) 450-8920</p>
                  <p className="text-xs text-slate-500">Lunes a Viernes: 8:00 AM - 6:00 PM EST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Tiempo de Respuesta</h4>
                  <p className="text-sm text-slate-400">Menor a 24 horas hábiles garantizado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-8 sm:p-10 rounded-3xl backdrop-blur-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-600/20 border border-blue-500 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Mensaje Recibido</h3>
                <p className="text-slate-300 text-sm max-w-sm mx-auto">
                  Gracias por contactar con VanguardiaCorp. Uno de nuestros socios directores se comunicará a la brevedad.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      company: "",
                      service: "Consultoría Estratégica",
                      message: "",
                    });
                  }}
                  className="mt-6 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium text-white transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  Solicitud de Información y Consulta
                </h3>

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    id="name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Roberto Martínez"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Correo Corporativo *
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nombre@empresa.com"
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Empresa u Organización *
                    </label>
                    <input
                      id="company"
                      required
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Nombre de la empresa"
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Área de Interés
                  </label>
                  <select
                    id="service"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Consultoría Estratégica">Consultoría Estratégica</option>
                    <option value="Transformación Digital & Cloud">Transformación Digital &amp; Cloud</option>
                    <option value="Inteligencia de Datos & BI">Inteligencia de Datos &amp; BI</option>
                    <option value="Ciberseguridad & Compliance">Ciberseguridad &amp; Compliance</option>
                    <option value="Automatización de Procesos">Automatización de Procesos</option>
                    <option value="Desarrollo del Talento & Liderazgo">Desarrollo del Talento &amp; Liderazgo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Detalle o Requerimiento *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describa brevemente el objetivo o desafío de su organización..."
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
