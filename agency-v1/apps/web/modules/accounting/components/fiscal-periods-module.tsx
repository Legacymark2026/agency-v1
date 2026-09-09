'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getFiscalPeriodsAction, 
  createFiscalPeriodAction, 
  closeFiscalPeriodAction, 
  reopenFiscalPeriodAction 
} from '@/modules/accounting/actions/accounting';
import type { FiscalPeriodRecord } from '@/modules/accounting/types';

export function FiscalPeriodsModule() {
  const [periods, setPeriods] = useState<FiscalPeriodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Period Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    setIsLoading(true);
    try {
      const res = await getFiscalPeriodsAction();
      if (res.success) {
        setPeriods(res.periods);
      }
    } catch {
      toast.error('Error al cargar periodos fiscales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePeriod = async (id: string, periodName: string) => {
    if (!confirm(`¿Confirmas el CIERRE DEFINITIVO del periodo "${periodName}"?\nUna vez cerrado, el sistema bloqueará cualquier asiento contable nuevo o modificación en este rango de fechas para cumplir con la DIAN.`)) {
      return;
    }

    try {
      const res = await closeFiscalPeriodAction(id);
      if (res.success) {
        toast.success(`Periodo ${periodName} CERRADO y blindado contra modificaciones.`);
        loadPeriods();
      } else {
        toast.error(res.error || 'Error al cerrar periodo');
      }
    } catch {
      toast.error('Error al procesar cierre');
    }
  };

  const handleReopenPeriod = async (id: string, periodName: string) => {
    const reason = prompt(`Indica el motivo justificado de reapertura para auditoría del periodo "${periodName}":`);
    if (!reason) return;

    try {
      const res = await reopenFiscalPeriodAction(id, reason);
      if (res.success) {
        toast.success(`Periodo ${periodName} reabierto con registro en log de auditoría.`);
        loadPeriods();
      } else {
        toast.error(res.error || 'Error al reabrir');
      }
    } catch {
      toast.error('Error al procesar reapertura');
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return;

    setIsCreating(true);
    try {
      const res = await createFiscalPeriodAction({ name, startDate, endDate });
      if (res.success) {
        toast.success(`Periodo ${name} creado exitosamente`);
        setIsModalOpen(false);
        setName('');
        setStartDate('');
        setEndDate('');
        loadPeriods();
      } else {
        toast.error(res.error || 'Error al crear periodo');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Control & Inmutabilidad de Periodos Fiscales
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bloqueo estricto a nivel de base de datos para impedir alteraciones contables en periodos auditados o cerrados ante la DIAN.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/10 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Aperturar Nuevo Periodo
        </button>
      </div>

      {/* Periods Table */}
      <div className="ds-card p-0 overflow-hidden border-slate-800">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">Historial de Periodos Contables</span>
          <button 
            onClick={loadPeriods}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-850">
                <th className="px-5 py-3">Periodo Fiscal</th>
                <th className="px-5 py-3">Fecha Inicio</th>
                <th className="px-5 py-3">Fecha Cierre</th>
                <th className="px-5 py-3 text-center">Comprobantes Asentados</th>
                <th className="px-5 py-3 text-center">Estado Legal</th>
                <th className="px-5 py-3 text-right">Acción de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                    {p.status === 'CLOSED' ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{p.startDate}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{p.endDate}</td>
                  <td className="px-5 py-3.5 text-center font-mono text-slate-300 font-bold">
                    {p.vouchersCount || 0}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      p.status === 'CLOSED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                    }`}>
                      {p.status === 'CLOSED' ? 'CERRADO (BLOQUEADO)' : 'ABIERTO (OPERATIVO)'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status === 'OPEN' ? (
                      <button
                        onClick={() => handleClosePeriod(p.id, p.name)}
                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Cerrar y Bloquear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopenPeriod(p.id, p.name)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Reabrir (Auditoría)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Fiscal Period */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                <h4 className="text-sm font-bold text-white">Aperturar Nuevo Periodo Fiscal</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white text-xs cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nombre del Periodo (ej. Octubre 2026)</label>
                <input
                  type="text"
                  required
                  placeholder="Octubre 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Fecha Inicial</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Fecha Final</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Aperturando...' : 'Crear Periodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
