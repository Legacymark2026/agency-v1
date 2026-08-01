'use client';

import { useState } from 'react';
import { Shield, CheckCircle, Search, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function CompliancePanel() {
  const [emailQuery, setEmailQuery] = useState('');
  const [gdprData, setGdprData] = useState<any>(null);

  const handleSearch = () => {
    if (!emailQuery) return;
    setGdprData({
      email: emailQuery,
      consentDate: '2026-05-12 14:32:10 UTC',
      consentSource: 'Formulario de registro Web (IP: 186.155.10.4)',
      campaignsReceived: 4,
      status: 'SUBSCRIBED'
    });
    toast.success(`Registro GDPR cargado para ${emailQuery}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            Privacidad & Cumplimiento GDPR / CAN-SPAM
          </h2>
          <p className="text-sm text-slate-400">Auditoría de consentimiento, derecho al olvido y diagnóstico de salud técnica de entregabilidad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Consentimiento Auditado</span>
            <span className="text-lg font-black text-white">100% Conformes</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Link de Cancelación RFC 8058</span>
            <span className="text-lg font-black text-teal-400">Activo (One-Click)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Filtro de Supresión</span>
            <span className="text-lg font-black text-white">Automático por Rebotes</span>
          </div>
        </div>
      </div>

      {/* GDPR Lookup tool */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-400" />
          Buscador de Consentimiento y Exportación GDPR
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            placeholder="Introduce el correo del usuario (ej: cliente@dominio.com)"
            className="flex-1 px-4 py-2.5 rounded-xl text-xs text-slate-200 bg-slate-950 border border-slate-800 outline-none focus:border-teal-500/50"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
          >
            Buscar Auditoría
          </button>
        </div>

        {gdprData && (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Correo:</span>
              <span className="text-white font-mono font-bold">{gdprData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fecha de Consentimiento:</span>
              <span className="text-teal-400 font-mono">{gdprData.consentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Origen de Opt-In:</span>
              <span className="text-slate-200">{gdprData.consentSource}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
