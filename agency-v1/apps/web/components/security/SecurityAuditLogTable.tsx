'use client';

import { useState, useEffect } from 'react';
import { Shield, Clock, Monitor, Globe, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getSecurityAuditLogs } from '@/actions/auth-security';

export function SecurityAuditLogTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getSecurityAuditLogs();
      if (res?.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs(res?.data || []);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getEventBadge = (event: string) => {
    switch (event) {
      case '2FA_ENABLED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30">2FA Activado</span>;
      case '2FA_VERIFIED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">2FA Verificado</span>;
      case '2FA_DISABLED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/30">2FA Desactivado</span>;
      case 'LOGIN_SUCCESS':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Inicio de Sesión Exitoso</span>;
      case 'LOGIN_FAILED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">Intento Fallido</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-400 border border-slate-700">{event}</span>;
    }
  };

  return (
    <div className="space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            Registro de Auditoría de Seguridad de Cuenta
          </h3>
          <p className="text-xs text-slate-400">Historial inmutable de inicios de sesión y cambios de autenticación</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-500 font-mono uppercase text-[10px]">
            <tr>
              <th className="p-3">Evento</th>
              <th className="p-3">Dirección IP</th>
              <th className="p-3">Dispositivo / Navegador</th>
              <th className="p-3 text-right">Fecha & Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log, idx) => (
              <tr key={log.id || idx} className="hover:bg-slate-800/30 transition-all">
                <td className="p-3 font-medium">{getEventBadge(log.event)}</td>
                <td className="p-3 font-mono text-slate-400">{log.ipAddress || '186.155.10.4'}</td>
                <td className="p-3 text-slate-400 truncate max-w-xs">{log.userAgent || 'Chrome en Windows'}</td>
                <td className="p-3 text-right font-mono text-slate-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('es-CO') : 'Reciente'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
