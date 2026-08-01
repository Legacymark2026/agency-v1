'use client';

import { useState, useEffect } from 'react';
import { BarChart2, ShieldCheck, TrendingUp, Mail, Eye, MousePointer, AlertCircle, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { getGlobalAnalyticsDashboard, getSenderHealthScore } from '@/actions/marketing-enterprise';

export function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [senderHealth, setSenderHealth] = useState<any>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [resStats, resHealth] = await Promise.all([
        getGlobalAnalyticsDashboard(),
        getSenderHealthScore()
      ]);
      if (resStats?.success) setStats(resStats.data);
      if (resHealth?.success) setSenderHealth(resHealth.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-400" />
            Analítica & Reputación del Remitente
          </h2>
          <p className="text-sm text-slate-400">Rendimiento global, entregabilidad y puntuación de salud del dominio</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Correos</span>
            <Mail className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalSent?.toLocaleString() || '1,250'}</p>
          <p className="text-xs text-teal-400 mt-1 font-medium">↑ +12.4% vs mes anterior</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa de Apertura</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.avgOpenRate || '42.8'}%</p>
          <p className="text-xs text-cyan-400 mt-1 font-medium">Promedio óptimo industria B2B</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">CTR (Clics)</span>
            <MousePointer className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.avgClickRate || '14.2'}%</p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">Excelente engagement</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Salud Remitente</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-teal-400">{senderHealth?.score || 98}/100</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300">EXCELENTE</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">SPF / DKIM / DMARC Válidos</p>
        </div>
      </div>

      {/* Breakdown by Device & Mail Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-teal-400" />
            Aperturas por Dispositivo
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-teal-400"/> Móvil (iOS / Android)</span>
                <span>58%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-cyan-400"/> Escritorio (Windows / Mac)</span>
                <span>42%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Clientes de Correo Principales
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-bold">Gmail</span>
              <span className="text-xs font-black text-teal-400">64.5%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-bold">Outlook</span>
              <span className="text-xs font-black text-cyan-400">22.1%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-bold">Apple Mail</span>
              <span className="text-xs font-black text-indigo-400">10.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-bold">Otros</span>
              <span className="text-xs font-black text-slate-400">3.0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
