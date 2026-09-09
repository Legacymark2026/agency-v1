'use client';

import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw,
  Stamp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { getOfficialFinancialStatementsAction } from '@/modules/accounting/actions/accounting';
import type { OfficialFinancialStatements } from '@/modules/accounting/types';

export function OfficialStatementsModule() {
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [statements, setStatements] = useState<OfficialFinancialStatements | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'balance_sheet' | 'income_statement'>('balance_sheet');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatements();
  }, [fiscalYear]);

  const loadStatements = async () => {
    setIsLoading(true);
    try {
      const res = await getOfficialFinancialStatementsAction({ fiscalYear });
      if (res.success && res.statements) {
        setStatements(res.statements);
      }
    } catch {
      toast.error('Error al generar estados financieros oficiales');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="ds-card p-4 border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveReportTab('balance_sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'balance_sheet'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            Balance General Clasificado NIIF
          </button>
          <button
            onClick={() => setActiveReportTab('income_statement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'income_statement'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            Estado de Resultados Integral (P&L)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Año:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-xl focus:outline-none focus:border-teal-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir Documento Oficial
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      {statements && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl text-slate-200 max-w-4xl mx-auto print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-800 print:border-black space-y-1">
            <h2 className="text-lg font-black text-white print:text-black uppercase tracking-wider">
              {statements.company.name}
            </h2>
            <p className="text-xs font-mono text-slate-400 print:text-black">
              NIT: {statements.company.nit} • Domicilio: {statements.company.city}
            </p>
            <h3 className="text-sm font-black uppercase text-teal-400 print:text-black pt-2">
              {activeReportTab === 'balance_sheet' 
                ? 'ESTADO DE SITUACIÓN FINANCIERA (BALANCE GENERAL CLASIFICADO)' 
                : 'ESTADO DE RESULTADOS INTEGRAL (PYG)'}
            </h3>
            <p className="text-[11px] text-slate-500 print:text-black">
              Expresado en Pesos Colombianos (COP) • Conforme a Normas Internacionales de Información Financiera (NIIF para PYMES)
            </p>
            <p className="text-xs font-bold text-slate-300 print:text-black">
              Al {statements.asOfDate}
            </p>
          </div>

          {/* Report Body: Balance Sheet */}
          {activeReportTab === 'balance_sheet' && (
            <div className="py-6 space-y-6 text-xs font-mono">
              {/* Activos */}
              <div>
                <h4 className="font-sans font-bold text-sm text-teal-300 print:text-black border-b border-slate-800 pb-1 mb-2">
                  1. ACTIVOS
                </h4>
                <div className="pl-4 space-y-1">
                  <span className="font-bold text-slate-400 print:text-black block">Activos Corrientes:</span>
                  {statements.balanceSheet.currentAssets.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-slate-300 print:text-black">
                      <span className="font-sans">{item.code} - {item.name}</span>
                      <span>${item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800">
                    <span>Total Activos Corrientes:</span>
                    <span>${statements.balanceSheet.totalCurrentAssets.toLocaleString()}</span>
                  </div>

                  <span className="font-bold text-slate-400 print:text-black block pt-3">Activos No Corrientes (Propiedad, Planta y Equipo):</span>
                  {statements.balanceSheet.nonCurrentAssets.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-slate-300 print:text-black">
                      <span className="font-sans">{item.code} - {item.name}</span>
                      <span>${item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800">
                    <span>Total Activos No Corrientes:</span>
                    <span>${statements.balanceSheet.totalNonCurrentAssets.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-black text-sm text-teal-400 print:text-black border-t-2 border-slate-700 mt-2">
                    <span className="font-sans">TOTAL ACTIVOS:</span>
                    <span>${statements.balanceSheet.totalAssets.toLocaleString()} COP</span>
                  </div>
                </div>
              </div>

              {/* Pasivos */}
              <div>
                <h4 className="font-sans font-bold text-sm text-amber-400 print:text-black border-b border-slate-800 pb-1 mb-2">
                  2. PASIVOS
                </h4>
                <div className="pl-4 space-y-1">
                  <span className="font-bold text-slate-400 print:text-black block">Pasivos Corrientes (Corto Plazo):</span>
                  {statements.balanceSheet.currentLiabilities.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-slate-300 print:text-black">
                      <span className="font-sans">{item.code} - {item.name}</span>
                      <span>${item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800">
                    <span>Total Pasivos Corrientes:</span>
                    <span>${statements.balanceSheet.totalCurrentLiabilities.toLocaleString()}</span>
                  </div>

                  <span className="font-bold text-slate-400 print:text-black block pt-3">Pasivos a Largo Plazo:</span>
                  {statements.balanceSheet.longTermLiabilities.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-slate-300 print:text-black">
                      <span className="font-sans">{item.code} - {item.name}</span>
                      <span>${item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-slate-100 border-t border-slate-800">
                    <span>Total Pasivos a Largo Plazo:</span>
                    <span>${statements.balanceSheet.totalLongTermLiabilities.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2 font-black text-sm text-amber-400 print:text-black border-t-2 border-slate-700 mt-2">
                    <span className="font-sans">TOTAL PASIVOS:</span>
                    <span>${statements.balanceSheet.totalLiabilities.toLocaleString()} COP</span>
                  </div>
                </div>
              </div>

              {/* Patrimonio */}
              <div>
                <h4 className="font-sans font-bold text-sm text-purple-400 print:text-black border-b border-slate-800 pb-1 mb-2">
                  3. PATRIMONIO NETO
                </h4>
                <div className="pl-4 space-y-1">
                  {statements.balanceSheet.equity.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-slate-300 print:text-black">
                      <span className="font-sans">{item.code} - {item.name}</span>
                      <span>${item.balance.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-black text-sm text-purple-400 print:text-black border-t-2 border-slate-700 mt-2">
                    <span className="font-sans">TOTAL PATRIMONIO:</span>
                    <span>${statements.balanceSheet.totalEquity.toLocaleString()} COP</span>
                  </div>

                  <div className="flex justify-between py-3 font-black text-base text-emerald-400 print:text-black border-t-4 border-slate-600 mt-4">
                    <span className="font-sans">TOTAL PASIVO + PATRIMONIO:</span>
                    <span>${statements.balanceSheet.totalLiabilitiesAndEquity.toLocaleString()} COP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Body: Income Statement */}
          {activeReportTab === 'income_statement' && (
            <div className="py-6 space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1 text-slate-200">
                <span className="font-sans font-bold">Ingresos de Actividades Ordinarias:</span>
                <span>${statements.incomeStatement.operatingRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-400">
                <span className="font-sans">(-) Costos de Ventas y Servicios:</span>
                <span>(${statements.incomeStatement.costOfSales.toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-teal-300 border-t border-slate-800">
                <span className="font-sans">UTILIDAD BRUTA:</span>
                <span>${statements.incomeStatement.grossProfit.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-400 pt-2">
                <span className="font-sans">(-) Gastos Operacionales de Administración y Nómina:</span>
                <span>(${statements.incomeStatement.operatingExpenses.toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-teal-300 border-t border-slate-800">
                <span className="font-sans">UTILIDAD OPERACIONAL:</span>
                <span>${statements.incomeStatement.operatingIncome.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-400 pt-2">
                <span className="font-sans">(-) Gastos Financieros y No Operacionales:</span>
                <span>(${statements.incomeStatement.financialExpenses.toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-slate-200 border-t border-slate-800">
                <span className="font-sans">UTILIDAD ANTES DE IMPUESTOS:</span>
                <span>${statements.incomeStatement.incomeBeforeTax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-400">
                <span className="font-sans">(-) Provisión Impuesto de Renta (35%):</span>
                <span>(${statements.incomeStatement.incomeTax.toLocaleString()})</span>
              </div>
              <div className="flex justify-between py-3 font-black text-base text-emerald-400 border-t-4 border-slate-600 mt-3">
                <span className="font-sans">UTILIDAD NETA DEL EJERCICIO:</span>
                <span>${statements.incomeStatement.netProfit.toLocaleString()} COP</span>
              </div>
            </div>
          )}

          {/* Legal Signatures Section */}
          <div className="pt-10 border-t-2 border-slate-800 print:border-black">
            <p className="text-[10px] text-slate-500 print:text-black italic text-center pb-8">
              Certificamos que hemos verificado previamente las afirmaciones contenidas en estos estados financieros y que las cifras han sido tomadas fielmente de los libros oficiales de contabilidad.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="w-48 mx-auto border-b border-slate-600 print:border-black pb-1 mb-2 font-mono text-[10px] text-teal-400">
                  Firma Auténtica
                </div>
                <span className="font-bold text-white print:text-black block">{statements.signatures.legalRepresentative.name}</span>
                <span className="text-[10px] text-slate-400 print:text-black block">{statements.signatures.legalRepresentative.idNumber}</span>
                <span className="text-[10px] text-slate-500 print:text-black font-semibold uppercase">{statements.signatures.legalRepresentative.title}</span>
              </div>

              <div className="space-y-1">
                <div className="w-48 mx-auto border-b border-slate-600 print:border-black pb-1 mb-2 font-mono text-[10px] text-teal-400">
                  Firma Auténtica
                </div>
                <span className="font-bold text-white print:text-black block">{statements.signatures.accountant.name}</span>
                <span className="text-[10px] text-slate-400 print:text-black block">{statements.signatures.accountant.idNumber}</span>
                <span className="text-[10px] text-teal-400 print:text-black font-mono font-bold block">{statements.signatures.accountant.professionalCard}</span>
                <span className="text-[10px] text-slate-500 print:text-black font-semibold uppercase">{statements.signatures.accountant.title}</span>
              </div>

              {statements.signatures.statutoryAuditor && (
                <div className="space-y-1">
                  <div className="w-48 mx-auto border-b border-slate-600 print:border-black pb-1 mb-2 font-mono text-[10px] text-teal-400">
                    Firma Auténtica
                  </div>
                  <span className="font-bold text-white print:text-black block">{statements.signatures.statutoryAuditor.name}</span>
                  <span className="text-[10px] text-slate-400 print:text-black block">{statements.signatures.statutoryAuditor.idNumber}</span>
                  <span className="text-[10px] text-teal-400 print:text-black font-mono font-bold block">{statements.signatures.statutoryAuditor.professionalCard}</span>
                  <span className="text-[10px] text-slate-500 print:text-black font-semibold uppercase">{statements.signatures.statutoryAuditor.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
