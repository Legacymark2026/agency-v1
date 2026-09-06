"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Share2, 
  Check, 
  Save, 
  Globe, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  Info
} from "lucide-react";

interface IntegrationState {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleSearchConsoleMeta: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  linkedinPartnerId: string;
  gtmEnabled: boolean;
  gaEnabled: boolean;
  gscEnabled: boolean;
  fbEnabled: boolean;
  tiktokEnabled: boolean;
  linkedinEnabled: boolean;
}

export default function AdminIntegracionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState<IntegrationState>({
    googleTagManagerId: "",
    googleAnalyticsId: "",
    googleSearchConsoleMeta: "",
    facebookPixelId: "",
    tiktokPixelId: "",
    linkedinPartnerId: "",
    gtmEnabled: false,
    gaEnabled: false,
    gscEnabled: false,
    fbEnabled: false,
    tiktokEnabled: false,
    linkedinEnabled: false,
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/admin/integrations");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (data.config) {
          setFormData({
            googleTagManagerId: data.config.googleTagManagerId || "",
            googleAnalyticsId: data.config.googleAnalyticsId || "",
            googleSearchConsoleMeta: data.config.googleSearchConsoleMeta || "",
            facebookPixelId: data.config.facebookPixelId || "",
            tiktokPixelId: data.config.tiktokPixelId || "",
            linkedinPartnerId: data.config.linkedinPartnerId || "",
            gtmEnabled: Boolean(data.config.gtmEnabled),
            gaEnabled: Boolean(data.config.gaEnabled),
            gscEnabled: Boolean(data.config.gscEnabled),
            fbEnabled: Boolean(data.config.fbEnabled),
            tiktokEnabled: Boolean(data.config.tiktokEnabled),
            linkedinEnabled: Boolean(data.config.linkedinEnabled),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin text-[#B08A1A]" />
          <span>Cargando configuración de integraciones...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
            Marketing &amp; Analítica Externa
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Integraciones &amp; Píxeles</span>
            <Share2 className="w-6 h-6 text-[#B08A1A]" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Conecte Google Analytics, Meta Pixel, TikTok, LinkedIn y Google Search Console sin tocar código.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-xs hover:brightness-110 transition-all shadow-md disabled:opacity-50 self-start sm:self-auto"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Guardando..." : savedSuccess ? "¡Guardado con Éxito!" : "Guardar Cambios"}</span>
        </button>
      </div>

      {/* Alerta de Éxito */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 shadow-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configuración de píxeles actualizada correctamente. Los cambios ya están activos en el portal público.</span>
        </div>
      )}

      {/* Nota de Privacidad y Consentimiento */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Cumplimiento RGPD &amp; Cookies Verificables:</p>
          <p className="text-blue-800 leading-relaxed">
            Las etiquetas de seguimiento activas (Meta, TikTok, Google Analytics, LinkedIn) únicamente se cargarán en el navegador de los usuarios si estos han aceptado las cookies analíticas en el banner de consentimiento, garantizando privacidad total y cumplimiento legal.
          </p>
        </div>
      </div>

      {/* Grid de Píxeles e Integraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Google Analytics 4 (GA4) */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                GA4
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Analytics 4</h3>
                <span className="text-[11px] text-slate-400">ID de Medición</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gaEnabled}
                onChange={(e) => setFormData({ ...formData, gaEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Measurement ID (ID de Flujo)</label>
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={formData.googleAnalyticsId}
              onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">Ejemplo: G-1A2B3C4D5E. Registra visitas, páginas y eventos automáticamente.</p>
          </div>
        </div>

        {/* 2. Google Tag Manager (GTM) */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                GTM
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Tag Manager</h3>
                <span className="text-[11px] text-slate-400">Contenedor de Etiquetas</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gtmEnabled}
                onChange={(e) => setFormData({ ...formData, gtmEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">GTM Container ID</label>
            <input
              type="text"
              placeholder="GTM-XXXXXXX"
              value={formData.googleTagManagerId}
              onChange={(e) => setFormData({ ...formData, googleTagManagerId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">Ejemplo: GTM-ABC1234. Inyecta el script y el noscript en el layout.</p>
          </div>
        </div>

        {/* 3. Facebook (Meta) Pixel */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                META
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Facebook / Meta Pixel</h3>
                <span className="text-[11px] text-slate-400">Campañas &amp; Remarketing</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fbEnabled}
                onChange={(e) => setFormData({ ...formData, fbEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Pixel ID de Facebook (Meta)</label>
            <input
              type="text"
              placeholder="123456789012345"
              value={formData.facebookPixelId}
              onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">ID numérico de tu conjunto de datos en Meta Events Manager.</p>
          </div>
        </div>

        {/* 4. TikTok Pixel */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                TT
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">TikTok Pixel</h3>
                <span className="text-[11px] text-slate-400">TikTok Ads Manager</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tiktokEnabled}
                onChange={(e) => setFormData({ ...formData, tiktokEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">TikTok Pixel ID</label>
            <input
              type="text"
              placeholder="C1234567890ABCDEF"
              value={formData.tiktokPixelId}
              onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">ID alfanumérico generado en TikTok Ads Event Manager.</p>
          </div>
        </div>

        {/* 5. LinkedIn Insight Tag */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                in
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">LinkedIn Insight Tag</h3>
                <span className="text-[11px] text-slate-400">Audiencias B2B &amp; Conversiones</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.linkedinEnabled}
                onChange={(e) => setFormData({ ...formData, linkedinEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">LinkedIn Partner ID</label>
            <input
              type="text"
              placeholder="1234567"
              value={formData.linkedinPartnerId}
              onChange={(e) => setFormData({ ...formData, linkedinPartnerId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">Número de Partner ID de LinkedIn Campaign Manager.</p>
          </div>
        </div>

        {/* 6. Google Search Console */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                GSC
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Google Search Console</h3>
                <span className="text-[11px] text-slate-400">Verificación de Propiedad SEO</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gscEnabled}
                onChange={(e) => setFormData({ ...formData, gscEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B08A1A]"></div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Token de Verificación HTML</label>
            <input
              type="text"
              placeholder="google-site-verification token o meta tag"
              value={formData.googleSearchConsoleMeta}
              onChange={(e) => setFormData({ ...formData, googleSearchConsoleMeta: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#B08A1A]"
            />
            <p className="text-[11px] text-slate-400">
              Pega el contenido del atributo content de tu meta-etiqueta de Search Console.
            </p>
          </div>
        </div>

      </div>

      {/* Botón inferior */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] text-slate-950 font-black text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Guardando..." : savedSuccess ? "¡Guardado con Éxito!" : "Guardar Toda la Configuración"}</span>
        </button>
      </div>
    </form>
  );
}
