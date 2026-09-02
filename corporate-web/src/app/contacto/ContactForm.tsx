"use client";

import { useState } from "react";
import { Send, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "Consultoría Estratégica & Directiva",
    urgency: "En las próximas 2 semanas",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (typeof window !== "undefined" && window.trackConversion) {
      window.trackConversion("form_submission", {
        service: formData.service,
        company: formData.company,
      });
    }
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-500/15 border border-[#B08A1A] text-[#B08A1A] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Solicitud Recibida</h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Su requerimiento ha sido registrado y asignado a un socio director de NEOGESTIÓN. Le contactaremos en menos de 24 horas hábiles.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setFormData({
                name: "",
                email: "",
                phone: "",
                company: "",
                service: "Consultoría Estratégica & Directiva",
                urgency: "En las próximas 2 semanas",
                message: "",
              });
            }}
            className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Enviar otro requerimiento
          </button>
          <a
            href="https://wa.me/18004508920?text=Hola%2C%20acabo%20de%20remitir%20mi%20formulario%20y%20deseo%20confirmar%20mi%20sesi%C3%B3n."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Confirmar por WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
      <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-2">
        Canal de Conversión Confidencial
      </span>
      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
        Solicitud de Diagnóstico &amp; Propuesta
      </h3>
      <p className="text-slate-600 text-sm mb-8 leading-relaxed">
        Complete los campos requeridos. Su información está amparada bajo estricto acuerdo de confidencialidad y confidencialidad ISO 27001.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Nombre Completo y Rol Directivo *</span>
            {formData.name.length > 3 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          </label>
          <input
            id="name"
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej. Ing. Roberto Mendoza - Director de Operaciones"
            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Email y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Correo Corporativo *</span>
              {formData.email.includes("@") && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </label>
            <input
              id="email"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="nombre@empresa.com"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Teléfono Directo *</span>
              {formData.phone.length > 6 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </label>
            <input
              id="phone"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Empresa y Plazo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Empresa u Organización *
            </label>
            <input
              id="company"
              required
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Nombre de la corporación"
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
            />
          </div>
          <div>
            <label htmlFor="urgency" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Plazo de Inicio Estimado
            </label>
            <select
              id="urgency"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
            >
              <option value="Inmediato (Esta semana)">Inmediato (Esta semana)</option>
              <option value="En las próximas 2 semanas">En las próximas 2 semanas</option>
              <option value="Próximo mes">Próximo mes</option>
              <option value="Planificación Anual">Planificación Anual</option>
            </select>
          </div>
        </div>

        {/* Servicio */}
        <div>
          <label htmlFor="service" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Área de Especialidad Solicitada
          </label>
          <select
            id="service"
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
          >
            <option value="Consultoría Estratégica & Directiva">Consultoría Estratégica &amp; Directiva</option>
            <option value="Transformación Digital & Cloud">Transformación Digital &amp; Cloud</option>
            <option value="Inteligencia de Negocio & BI">Inteligencia de Negocio &amp; BI</option>
            <option value="Ciberseguridad & Compliance">Ciberseguridad &amp; Compliance</option>
            <option value="Automatización de Procesos">Automatización de Procesos</option>
            <option value="Gestión del Cambio & Liderazgo">Gestión del Cambio &amp; Liderazgo</option>
          </select>
        </div>

        {/* Mensaje */}
        <div>
          <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Descripción del Requerimiento *
          </label>
          <textarea
            id="message"
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Describa el objetivo estratégico, cuello de botella o meta operativa de su organización..."
            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#B08A1A] focus:bg-white transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-xl gold-glow disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Procesando Solicitud...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar Solicitud Confidencial</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
