import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldCheck, Sparkles, Clock, Terminal, TrendingUp, Users, Zap, ShieldAlert, ArrowRight, FileText, Scan, Webhook, Video, DollarSign } from "lucide-react";
import { InteractiveSpotlight } from "@/components/dashboard/InteractiveSpotlight";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  const dbUser = user?.id
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      })
    : null;
  const currentRole = dbUser?.role || user?.role || "Guest";

  const activityLogs: any[] = user?.id
    ? await prisma.userActivityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const kpis = [
    { title: "Facturación Mensual DIAN", value: "$48,920,000 COP", change: "+18.4%", isPositive: true, icon: TrendingUp, color: "text-emerald-400" },
    { title: "Pipeline CRM & Leads", value: "1,284 Leads", change: "34.2% Conversión", isPositive: true, icon: Users, color: "text-cyan-400" },
    { title: "Disponibilidad SLA (Uptime)", value: "99.992%", change: "24/24 Microservicios", isPositive: true, icon: Zap, color: "text-amber-400" },
    { title: "Guardián Anti-Fraude", value: "0 Alertas", change: "Protección Z-Score Activa", isPositive: true, icon: ShieldAlert, color: "text-indigo-400" },
  ];

  const quickActions = [
    { title: "Escáner OCR de Recibos", desc: "Extrae facturas en PDF/Imagen automáticamente", href: "/dashboard/invoicing/ocr-scanner", icon: Scan, badge: "Nuevo" },
    { title: "Guardián Anti-Fraude", desc: "Evalúa transacciones con IA y Z-Score", href: "/dashboard/invoicing/fraud-guard", icon: ShieldAlert, badge: "AI" },
    { title: "Sandbox de Webhooks", desc: "Diseña e inspecciona eventos HMAC SHA256", href: "/dashboard/tools/webhooks", icon: Webhook, badge: "Dev" },
    { title: "Monitor de SLA 99.99%", desc: "Estado en vivo y certificado de disponibilidad", href: "/dashboard/security/sla", icon: Zap, badge: "99.99%" },
    { title: "Comisiones de Afiliados", desc: "Liquidaciones Tier 1 (20%) y Tier 2 (5%)", href: "/dashboard/affiliate/commissions", icon: DollarSign, badge: "Finanzas" },
    { title: "Explorador de API Pública", desc: "Genera claves de acceso y prueba endpoints REST", href: "/dashboard/tools/api-docs", icon: FileText, badge: "API" },
  ];

  const microservicesList = [
    "api-gateway", "auth-service", "crm-service", "inbox-service",
    "finance-service", "ai-engine", "pos-service", "automation-service",
    "notification-service", "analytics-service", "hr-service", "video-service"
  ];

  return (
    <div className="ds-page space-y-8 p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Grid background overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />

      {/* ── Executive Header ── */}
      <InteractiveSpotlight className="relative z-10 ds-card group border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.08),transparent_70%)] pointer-events-none" />
        <div className="absolute top-4 right-4 font-mono text-xs text-slate-500 uppercase tracking-widest">[C_LEVEL · EXECUTIVE_HUB]</div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center space-x-3">
              <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full text-xs font-bold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
                <Sparkles size={12} /> Operaciones en Tiempo Real · Live
              </span>
              <span className="text-xs text-slate-400 font-mono">Presiona <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-[10px]">Ctrl+K</kbd> para buscar</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Bienvenido,{" "}
              <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                {user?.name?.split(" ")[0] || "Ejecutivo"}
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Consola de mando centralizada para el control total de operaciones, microservicios y finanzas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-950/40 border border-teal-500/30 rounded-xl text-xs font-mono text-teal-300 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-teal-400" />
              {currentRole}
            </div>
          </div>
        </div>
      </InteractiveSpotlight>

      {/* ── 4 Real-Time KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <Icon size={16} className={kpi.color} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white mt-4">{kpi.value}</div>
              <div className="text-xs font-medium text-emerald-400 mt-1">{kpi.change}</div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Action Grid ── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <span>⚡ Herramientas y Accesos Rápidos</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 backdrop-blur-xl p-5 rounded-2xl shadow-lg transition-all hover:bg-slate-900/90 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-teal-400 group-hover:text-teal-300 group-hover:scale-110 transition-all">
                      <Icon size={20} />
                    </div>
                    {action.badge && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/40">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">{action.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{action.desc}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                  Acceder al módulo <ArrowRight size={12} className="ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Microservices Topology Grid ── */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-200">Topología de Microservicios Activos (24/24 Online)</h2>
          <span className="text-xs font-mono text-emerald-400">Salud General: 100% OK</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {microservicesList.map((svc) => (
            <div key={svc} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center space-x-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-300 truncate">{svc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <InteractiveSpotlight className="relative z-10 ds-section border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
              <Clock size={16} className="text-teal-400" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">Registro de Actividad Reciente</p>
              <p className="text-xs text-slate-500">Eventos del sistema e ingestión automática</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-full border border-teal-500/30">
            Actualización Automática
          </span>
        </div>

        <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-4">
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-[calc(1.5rem+0.4rem)] top-1.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-slate-950" />
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{log.action}</span>
                    <span className="text-slate-400">
                      {log.details ? (typeof log.details === "string" ? log.details : JSON.stringify(log.details)) : "Operación de sistema completada exitosamente."}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              &gt; No hay actividad reciente registrada en la sesión actual_
            </div>
          )}
        </div>
      </InteractiveSpotlight>
    </div>
  );
}
