'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getFxRevaluationReportAction, 
  executeFxAdjustmentVoucherAction 
} from '@/modules/accounting/actions/accounting';
import type { FxRevaluationReport } from '@/modules/accounting/types';

export function FxRevaluationModule({ onRefresh }: { onRefresh?: () => void }) {
  const [trmInput, setTrmInput] = useState(4050);
  const [report, setReport] = useState<FxRevaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostingVoucher, setIsPostingVoucher] = useState(false);

  useEffect(() => {
    loadReport();
  }, [trmInput]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await getFxRevaluationReportAction({ currentTrm: trmInput });
      if (res.success && res.report) {
        setReport(res.report);
      }
    } catch {
      toast.error('Error al calcular revalorización cambiaria');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostAdjustment = async () => {
    if (!report) return;

    setIsPostingVoucher(true);
    try {
      const res = await executeFxAdjustmentVoucherAction({ currentTrm: trmInput });
      if (res.success) {
        toast.success(res.message || 'Comprobante de Diferencia en Cambio asentado con éxito');
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.error || 'Error al asentar ajuste');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al ejecutar comprobante');
    } finally {
      setIsPostingVoucher(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & TRM Simulator */}
      <div className="ds-card p-5 border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/25 text-teal-400">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Diferencia en Cambio Multi-Moneda (NIIF 21 / NIC 21)
              <span className="text-[10px] font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                Efectos Cambiarios
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Reexpresión automática de saldos en moneda extranjera a la Tasa Representativa del Mercado (TRM) oficial.
            </p>
          </div>
        </div>

        {/* TRM Input Box */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shrink-0">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">TRM Cierre Oficial (USD/COP)</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-400 font-mono text-sm font-bold">$</span>
              <input
                type="number"
                value={trmInput}
                onChange={(e) => setTrmInput(Number(e.target.value))}
                className="w-24 bg-transparent font-mono font-black text-white text-base focus:outline-none"
              />
              <span className="text-[10px] text-teal-400 font-mono">COP</span>
            </div>
          </div>
          <button
            onClick={loadReport}
            className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            title="Recalcular con nueva TRM"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="ds-card p-5 border-slate-800 bg-slate-950/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Saldo Total en Dólares (USD)</span>
            <p className="text-2xl font-black text-white font-mono mt-2">
              ${report.accounts.reduce((s, a) => s + a.foreignBalanceUSD, 0).toLocaleString()} USD
            </p>
            <span className="text-xs text-slate-500 mt-1 block">Activos monetarios sujetos a fluctuación cambiaria</span>
          </div>

          <div className="ds-card p-5 border-slate-800 bg-slate-950/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Saldo en Libros Histórico</span>
            <p className="text-2xl font-black text-slate-300 font-mono mt-2">
              ${report.accounts.reduce((s, a) => s + a.bookBalanceCOP, 0).toLocaleString()} COP
            </p>
            <span className="text-xs text-slate-500 mt-1 block">Registrado a TRM histórica promedio ($3,900)</span>
          </div>

          <div className={`ds-card p-5 border ${
            report.totalDifferenceCOP >= 0 
              ? 'border-emerald-500/30 bg-emerald-950/15' 
              : 'border-rose-500/30 bg-rose-950/15'
          }`}>
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold text-slate-400">
              {report.totalDifferenceCOP >= 0 ? 'Ganancia Neta por Diferencia en Cambio' : 'Pérdida Neta por Diferencia en Cambio'}
            </span>
            <div className="flex items-center gap-2 mt-2 font-mono">
              {report.totalDifferenceCOP >= 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-rose-400" />
              )}
              <p className={`text-2xl font-black ${
                report.totalDifferenceCOP >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {report.totalDifferenceCOP >= 0 ? '+' : ''}${report.totalDifferenceCOP.toLocaleString()} COP
              </p>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Cuenta sugerida: {report.totalDifferenceCOP >= 0 ? report.gainAccountCode : report.lossAccountCode}
            </span>
          </div>
        </div>
      )}

      {/* Revaluation Accounts Breakdown Table */}
      {report && (
        <div className="ds-card p-0 overflow-hidden border-slate-800">
          <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Desglose de Cuentas Reexpresadas a TRM ${report.currentTrm.toLocaleString()}</span>
            <button
              onClick={handlePostAdjustment}
              disabled={isPostingVoucher}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isPostingVoucher ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Asentar Comprobante en Libro Mayor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-850">
                  <th className="px-5 py-3">Cuenta Contable</th>
                  <th className="px-5 py-3 text-right">Saldo en Divisa (USD)</th>
                  <th className="px-5 py-3 text-right">Saldo en Libros (COP)</th>
                  <th className="px-5 py-3 text-right">Saldo Revaluado TRM (COP)</th>
                  <th className="px-5 py-3 text-right">Ajuste Neto (Diferencia)</th>
                  <th className="px-5 py-3 text-center">Impacto NIIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-mono">
                {report.accounts.map((acc) => (
                  <tr key={acc.accountId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3.5 font-sans font-bold text-white">
                      {acc.accountName}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-teal-400">
                      ${acc.foreignBalanceUSD.toLocaleString()} USD
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400">
                      ${acc.bookBalanceCOP.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-200 font-bold">
                      ${acc.revaluedBalanceCOP.toLocaleString()}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-black ${
                      acc.differenceCOP >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {acc.differenceCOP >= 0 ? '+' : ''}${acc.differenceCOP.toLocaleString()} COP
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        acc.type === 'GAIN'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {acc.type === 'GAIN' ? 'GANANCIA' : 'PÉRDIDA'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
