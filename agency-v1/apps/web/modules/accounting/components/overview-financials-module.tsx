'use client';

import { useState } from 'react';
import { 
  Gauge, 
  PieChart, 
  Printer, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';

interface OverviewFinancialsModuleProps {
  financialRatios: any;
  trialBalance: any;
  pnlReport: any;
  isLoading?: boolean;
}

export function OverviewFinancialsModule({
  financialRatios,
  trialBalance,
  pnlReport,
  isLoading,
}: OverviewFinancialsModuleProps) {
  const [subTab, setSubTab] = useState<'ratios' | 'trial_balance' | 'pnl'>('ratios');

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setSubTab('ratios')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'ratios'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-teal-400" />
          Ratios Financieros & Salud NIIF
        </button>
        <button
          onClick={() => setSubTab('trial_balance')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'trial_balance'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          Balance de Comprobación y Prueba
        </button>
        <button
          onClick={() => setSubTab('pnl')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'pnl'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-teal-400" />
          Estado de Resultados (P&L)
        </button>
      </div>

      {/* ── 1. FINANCIAL RATIOS SUB-TAB ── */}
      {subTab === 'ratios' && financialRatios && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ds-card p-5 border-teal-500/30 bg-teal-950/15">
              <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-bold">Razón Corriente (Liquidez)</span>
              <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{financialRatios.razonCorriente}x</p>
              <p className="text-xs text-slate-400 mt-1">Por cada $1.00 de deuda a corto plazo, la empresa tiene ${financialRatios.razonCorriente} de respaldo.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Prueba Ácida (Quick Ratio)</span>
              <p className="text-3xl font-black text-white mt-2 font-mono">{financialRatios.pruebaAcida}x</p>
              <p className="text-xs text-slate-400 mt-1">Capacidad de pago inmediata sin depender de inventarios.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Nivel de Endeudamiento</span>
              <p className="text-3xl font-black text-amber-400 mt-2 font-mono">{financialRatios.nivelEndeudamiento}%</p>
              <p className="text-xs text-slate-400 mt-1">Proporción de los activos totales financiada por terceros.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Capital de Trabajo (KTNO)</span>
              <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${financialRatios.ktno?.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Recursos netos requeridos para la operación comercial.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Margen Operativo (EBITDA)</span>
              <p className="text-3xl font-black text-teal-400 mt-2 font-mono">{financialRatios.margenOperativo}%</p>
              <p className="text-xs text-slate-400 mt-1">Eficiencia operativa antes de intereses e impuestos.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Margen Neto NIIF</span>
              <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{financialRatios.margenNeto}%</p>
              <p className="text-xs text-slate-400 mt-1">Porcentaje de ventas convertido en beneficio neto.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ROE (Retorno sobre Patrimonio)</span>
              <p className="text-3xl font-black text-purple-400 mt-2 font-mono">{financialRatios.roe}%</p>
              <p className="text-xs text-slate-400 mt-1">Rendimiento que obtienen los accionistas por su capital.</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ROA (Retorno sobre Activos)</span>
              <p className="text-3xl font-black text-blue-400 mt-2 font-mono">{financialRatios.roa}%</p>
              <p className="text-xs text-slate-400 mt-1">Rentabilidad generada por el total de activos invertidos.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. TRIAL BALANCE SUB-TAB ── */}
      {subTab === 'trial_balance' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-400" />
                Balance de Comprobación y Prueba NIIF
              </h3>
              <p className="text-xs text-slate-400">Consolidación de saldos y movimientos por cuentas mayores del Libro Mayor.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Balance
              </button>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Partida Doble Verificada
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3">Código PUC</th>
                  <th className="pb-3">Nombre de la Cuenta</th>
                  <th className="pb-3">Clase</th>
                  <th className="pb-3 text-right">Saldo Inicial</th>
                  <th className="pb-3 text-right">Débitos</th>
                  <th className="pb-3 text-right">Créditos</th>
                  <th className="pb-3 text-right">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {trialBalance?.items?.map((item: any) => (
                  <tr key={item.code} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-bold text-teal-400">{item.code}</td>
                    <td className="py-3 text-slate-200 font-sans">{item.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.category === 'ACTIVO' ? 'bg-blue-500/10 text-blue-400' :
                        item.category === 'PASIVO' ? 'bg-amber-500/10 text-amber-400' :
                        item.category === 'PATRIMONIO' ? 'bg-purple-500/10 text-purple-400' :
                        item.category === 'INGRESOS' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">${item.initialBalance?.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-300">${item.debits?.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-300">${item.credits?.toLocaleString()}</td>
                    <td className="py-3 text-right font-bold text-white">${item.finalBalance?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. P&L / ESTADO DE RESULTADOS SUB-TAB ── */}
      {subTab === 'pnl' && pnlReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ds-card p-5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Ingresos Operacionales (Ventas)</span>
              <p className="text-2xl font-black text-white mt-2 font-mono">${pnlReport.grossRevenue?.toLocaleString()}</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Costos & Gastos Operacionales</span>
              <p className="text-2xl font-black text-rose-400 mt-2 font-mono">${(pnlReport.operatingCosts + pnlReport.operatingExpenses)?.toLocaleString()}</p>
            </div>
            <div className="ds-card p-5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Utilidad Operacional (EBITDA)</span>
              <p className="text-2xl font-black text-teal-400 mt-2 font-mono">${pnlReport.operatingIncome?.toLocaleString()}</p>
            </div>
            <div className="ds-card p-5 border-teal-500/40 bg-teal-950/20">
              <span className="text-xs font-mono text-teal-300 uppercase tracking-wider font-bold">Utilidad Neta del Ejercicio</span>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">${pnlReport.netIncome?.toLocaleString()}</p>
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-400" />
              Estructura Detallada de Pérdidas y Ganancias (NIIF)
            </h3>
            <div className="divide-y divide-slate-800/80 font-mono text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-300 font-sans font-bold">(+) Ingresos Brutos de Actividades Ordinarias</span>
                <span className="font-bold text-white">${pnlReport.grossRevenue?.toLocaleString()} COP</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-400 font-sans">(-) Costos de Ventas y Prestación de Servicios</span>
                <span className="font-bold text-rose-400">-${pnlReport.operatingCosts?.toLocaleString()} COP</span>
              </div>
              <div className="py-3 flex justify-between items-center bg-slate-900/40 px-3 rounded-lg">
                <span className="text-teal-300 font-sans font-bold">(=) Utilidad Bruta</span>
                <span className="font-bold text-teal-400">${(pnlReport.grossRevenue - pnlReport.operatingCosts)?.toLocaleString()} COP</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-400 font-sans">(-) Gastos Administrativos & Operacionales</span>
                <span className="font-bold text-rose-400">-${pnlReport.operatingExpenses?.toLocaleString()} COP</span>
              </div>
              <div className="py-3 flex justify-between items-center bg-teal-950/20 px-3 rounded-lg border border-teal-800/30">
                <span className="text-emerald-400 font-sans font-black text-sm">(=) Utilidad Neta Final</span>
                <span className="font-black text-emerald-300 text-sm">${pnlReport.netIncome?.toLocaleString()} COP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
