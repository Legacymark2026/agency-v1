"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  MessageCircle, 
  MailCheck, 
  TrendingUp, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  Tablet, 
  FileText, 
  ExternalLink,
  Clock,
  ArrowRight
} from "lucide-react";

interface AnalyticsStats {
  totalViews: number;
  todayViews: number;
  whatsappClicks: number;
  formSubmissions: number;
  totalPosts: number;
  publishedPosts: number;
  devices: { type: string; count: number }[];
  topPages: { path: string; views: number }[];
  topPosts: {
    id: string;
    title: string;
    slug: string;
    category: string;
    viewsCount: number;
    published: boolean;
  }[];
  recentEvents: {
    id: string;
    path: string;
    eventType: string;
    deviceType: string;
    createdAt: string;
  }[];
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/analytics/stats");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [router, refreshIndex]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B08A1A] block mb-1">
            Telemetría en Tiempo Real
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Dashboard de Analítica &amp; Tráfico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Métricas de visitantes, comportamiento de lectura y eventos de conversión corporativos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRefreshIndex((r) => r + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-[#B08A1A] transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B08A1A]" : ""}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* 4 Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Visitas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Visitas Totales
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block leading-none mb-1">
              {stats?.totalViews ?? "—"}
            </span>
            <span className="text-xs text-slate-400">Páginas vistas históricas</span>
          </div>
        </div>

        {/* Visitas Hoy */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Visitas de Hoy
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#B08A1A] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-slate-900 block leading-none mb-1">
              {stats?.todayViews ?? "—"}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sesiones activas en curso
            </span>
          </div>
        </div>

        {/* Conversiones WhatsApp */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Conversiones WhatsApp
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-emerald-700 block leading-none mb-1">
              {stats?.whatsappClicks ?? "—"}
            </span>
            <span className="text-xs text-slate-400">Clics en chat directo</span>
          </div>
        </div>

        {/* Formularios Enviados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Leads / Contactos
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MailCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-purple-900 block leading-none mb-1">
              {stats?.formSubmissions ?? "—"}
            </span>
            <span className="text-xs text-slate-400">Propuestas solicitadas</span>
          </div>
        </div>
      </div>

      {/* Filas Secundarias: Páginas Populares & Distribución de Dispositivos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Páginas Más Visitadas (Col 7) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#B08A1A]" />
              <span>Rendimiento por Página</span>
            </h3>
            <span className="text-xs text-slate-400">Top 8 Rutas</span>
          </div>

          <div className="space-y-3">
            {stats?.topPages?.map((page, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-bold text-slate-400">#{i + 1}</span>
                  <span className="font-mono font-bold text-slate-800">{page.path}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {page.views} vistas
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dispositivos (Col 5) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#B08A1A]" />
                <span>Tipos de Dispositivo</span>
              </h3>
              <span className="text-xs text-slate-400">Sesiones</span>
            </div>

            <div className="space-y-4">
              {stats?.devices?.map((dev, i) => {
                const total = stats.totalViews || 1;
                const pct = Math.round((dev.count / total) * 100);
                const Icon =
                  dev.type === "mobile"
                    ? Smartphone
                    : dev.type === "tablet"
                    ? Tablet
                    : Laptop;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 capitalize">
                        <Icon className="w-3.5 h-3.5 text-[#B08A1A]" />
                        <span>{dev.type}</span>
                      </span>
                      <span>
                        {dev.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#B08A1A] to-[#D4AF37] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-500">
            Los datos se almacenan de forma agregada en `neogestion.db` sin registrar información personal sensible.
          </div>
        </div>
      </div>

      {/* Artículos de Blog con Más Lecturas */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B08A1A]" />
              <span>Artículos de Blog Más Leídos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Total de publicaciones: {stats?.totalPosts} ({stats?.publishedPosts} publicadas)
            </p>
          </div>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#B08A1A] hover:underline"
          >
            <span>Gestionar todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Título</th>
                <th className="pb-3 font-semibold">Categoría</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold text-right">Lecturas Reales</th>
                <th className="pb-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.topPosts?.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {post.title}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#B08A1A] font-semibold border border-[#B08A1A]/30 text-[11px]">
                      {post.category}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {post.published ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">
                        Publicado
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium text-[11px]">
                        Borrador
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-right font-black text-slate-900 text-sm">
                    {post.viewsCount}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-[#B08A1A] transition-colors p-1"
                      aria-label="Ver artículo en web"
                    >
                      <ExternalLink className="w-4 h-4 inline" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Eventos en Tiempo Real */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#B08A1A]" />
            <span>Últimos Eventos Registrados en Vivo</span>
          </h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Flujo en directo
          </span>
        </div>

        <div className="space-y-2">
          {stats?.recentEvents?.map((ev) => {
            const date = new Date(ev.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const isConversion =
              ev.eventType === "whatsapp_click" || ev.eventType === "form_submission";
            return (
              <div
                key={ev.id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                  isConversion
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400">{date}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                      ev.eventType === "whatsapp_click"
                        ? "bg-emerald-600 text-white"
                        : ev.eventType === "form_submission"
                        ? "bg-purple-600 text-white"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {ev.eventType}
                  </span>
                  <span className="font-mono font-semibold text-slate-800">{ev.path}</span>
                </div>
                <span className="text-[11px] text-slate-500 capitalize">{ev.deviceType}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
