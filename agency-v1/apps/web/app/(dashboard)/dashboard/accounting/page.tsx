'use client';

import { useState } from 'react';
import { 
  Calculator, 
  BookOpen, 
  FileText, 
  DollarSign, 
  Plus, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { calculateWithholdingsAction, recordJournalVoucherAction } from '@/modules/accounting/actions/accounting';
import { toast } from 'sonner';

export default function AccountingDashboardPage() {
  const [activeTab, setActiveTab] = useState<'puc' | 'withholdings' | 'vouchers' | 'balance'>('withholdings');

  // Withholding Calculator state
  const [subtotal, setSubtotal] = useState<number>(5000000);
  const [txType, setTxType] = useState<'COMPRAS' | 'SERVICIOS' | 'HONORARIOS'>('SERVICIOS');
  const [applyReteIVA, setApplyReteIVA] = useState<boolean>(true);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Journal Entry Form State
  const [concept, setConcept] = useState('Prestación de Servicios de Consultoría');
  const [voucherNum, setVoucherNum] = useState(`CD-${Date.now().toString().slice(-6)}`);
  const [lines, setLines] = useState([
    { accountCode: '110505', accountName: 'Caja General', debit: 5000000, credit: 0, thirdPartyNit: '902028722-3' },
    { accountCode: '413501', accountName: 'Ingresos por Servicios de Software', debit: 0, credit: 5000000, thirdPartyNit: '902028722-3' },
  ]);

  const handleCalculateWithholdings = async () => {
    setIsCalculating(true);
    try {
      const res = await calculateWithholdingsAction({
        subtotal,
        transactionType: txType,
        applyReteIVA,
        reteIcaRatePerMil: 9.66,
      });
      setCalcResult(res);
      toast.success('Retenciones tributarias calculadas correctamente');
    } catch (err: any) {
      toast.error('Error calculando retenciones');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '', accountName: '', debit: 0, credit: 0, thirdPartyNit: '' }]);
  };

  const handleSaveVoucher = async () => {
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

    if (totalDebit !== totalCredit) {
      toast.error(`Partida Doble desbalanceada: Débito ($${totalDebit}) ≠ Crédito ($${totalCredit})`);
      return;
    }

    try {
      const res = await recordJournalVoucherAction({
        voucherNumber: voucherNum,
        concept,
        lines,
      });

      if (res.success) {
        toast.success(`Comprobante de Diario ${voucherNum} registrado en el Libro Mayor.`);
        setVoucherNum(`CD-${Date.now().toString().slice(-6)}`);
      } else {
        toast.error(res.error || 'Error al asentar comprobante');
      }
    } catch (err: any) {
      toast.error('Error al guardar comprobante');
    }
  };

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <div className="ds-page space-y-8 w-full">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="mb-4">
            <span className="ds-badge ds-badge-teal">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              FIN_SYS · CONTABILIDAD & PUC
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="ds-icon-box w-12 h-12">
              <BookOpen className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="ds-heading-page">Módulo Contable & Libro Mayor</h1>
              <p className="ds-subtext mt-1">Plan Único de Cuentas (PUC) · Comprobantes de Diario · Retenciones DIAN · Balances</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('vouchers')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs uppercase tracking-widest text-white bg-teal-900/40 border border-teal-600/50 hover:bg-teal-800/40 transition-all shadow-[0_0_20px_-8px_rgba(13,148,136,0.5)]">
            <Plus className="w-4 h-4" /> Nuevo Asiento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('withholdings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition-all ${
            activeTab === 'withholdings'
              ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" /> Retenciones Tributarias
        </button>

        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition-all ${
            activeTab === 'vouchers'
              ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Asientos & Comprobantes
        </button>

        <button
          onClick={() => setActiveTab('puc')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-sm transition-all ${
            activeTab === 'puc'
              ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Catálogo PUC
        </button>
      </div>

      {/* Content 1: Withholdings Calculator */}
      {activeTab === 'withholdings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="ds-card space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-400" /> Calculadora de Retenciones (ReteFuente, ReteIVA, ReteICA)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="ds-mono-label text-xs">Monto Subtotal Base (COP)</label>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-4 py-2.5 font-mono text-sm bg-slate-900/80 border border-slate-800 text-white rounded-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="ds-mono-label text-xs">Tipo de Transacción</label>
                <select
                  value={txType}
                  onChange={(e: any) => setTxType(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 font-mono text-sm bg-slate-900/80 border border-slate-800 text-white rounded-sm focus:border-teal-600 focus:outline-none"
                >
                  <option value="SERVICIOS">Servicios Generales (4.0%)</option>
                  <option value="HONORARIOS">Honorarios Profesionales (10.0%)</option>
                  <option value="COMPRAS">Compras Generales (2.5%)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="reteIva"
                  checked={applyReteIVA}
                  onChange={(e) => setApplyReteIVA(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="reteIva" className="text-xs text-slate-300">
                  Aplicar Retención de IVA (15% del IVA facturado)
                </label>
              </div>

              <button
                onClick={handleCalculateWithholdings}
                disabled={isCalculating}
                className="w-full py-3 mt-4 font-mono text-xs font-bold uppercase tracking-widest text-white bg-teal-700/60 hover:bg-teal-600 border border-teal-500 rounded-sm transition-all"
              >
                {isCalculating ? 'Calculando...' : 'Calcular Retenciones Tributarias'}
              </button>
            </div>
          </div>

          <div className="ds-card space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" /> Liquidación NIIF / DIAN
            </h2>

            {calcResult ? (
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-bold">${calcResult.subtotal.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">IVA (19%):</span>
                  <span className="text-teal-400">+${calcResult.vatAmount.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">ReteFuente ({(calcResult.reteFuenteRate * 100).toFixed(1)}%):</span>
                  <span className="text-red-400">-${calcResult.reteFuenteAmount.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">ReteIVA (15%):</span>
                  <span className="text-red-400">-${calcResult.reteIvaAmount.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">ReteICA (9.66 ‰):</span>
                  <span className="text-red-400">-${calcResult.reteIcaAmount.toLocaleString()} COP</span>
                </div>
                <div className="flex justify-between py-3 bg-teal-950/40 p-3 rounded border border-teal-800/50">
                  <span className="text-teal-300 font-bold">Total a Pagar Neto:</span>
                  <span className="text-teal-200 text-lg font-black">${calcResult.netPayable.toLocaleString()} COP</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center">
                <Calculator className="w-12 h-12 mb-2 text-slate-600" />
                <p className="text-xs font-mono uppercase">&gt; Ingresa los valores y pulsa calcular_</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content 2: Journal Voucher Entry */}
      {activeTab === 'vouchers' && (
        <div className="ds-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" /> Asiento de Comprobante de Diario
              </h2>
              <p className="text-xs text-slate-400 mt-1">Registro de partida doble con imputación a cuentas NIIF</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-mono rounded ${isBalanced ? 'bg-teal-950 text-teal-300 border border-teal-600' : 'bg-red-950 text-red-300 border border-red-600'}`}>
                {isBalanced ? '✅ Partida Doble Cuadrada' : '⚠️ Desbalance Débito/Crédito'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="ds-mono-label text-xs">Número de Comprobante</label>
              <input
                type="text"
                value={voucherNum}
                onChange={(e) => setVoucherNum(e.target.value)}
                className="w-full mt-1 px-3 py-2 font-mono text-xs bg-slate-900/80 border border-slate-800 text-white rounded-sm"
              />
            </div>
            <div>
              <label className="ds-mono-label text-xs">Concepto / Glosa</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full mt-1 px-3 py-2 font-mono text-xs bg-slate-900/80 border border-slate-800 text-white rounded-sm"
              />
            </div>
          </div>

          {/* Lines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border border-slate-800">
              <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Código Cuenta</th>
                  <th className="p-3">Nombre de Cuenta</th>
                  <th className="p-3">Tercero (NIT)</th>
                  <th className="p-3 text-right">Débito (COP)</th>
                  <th className="p-3 text-right">Crédito (COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2">
                      <input
                        type="text"
                        value={line.accountCode}
                        onChange={(e) => {
                          const n = [...lines];
                          n[idx].accountCode = e.target.value;
                          setLines(n);
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 text-teal-300 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={line.accountName}
                        onChange={(e) => {
                          const n = [...lines];
                          n[idx].accountName = e.target.value;
                          setLines(n);
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={line.thirdPartyNit}
                        onChange={(e) => {
                          const n = [...lines];
                          n[idx].thirdPartyNit = e.target.value;
                          setLines(n);
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 text-slate-300 rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) => {
                          const n = [...lines];
                          n[idx].debit = parseFloat(e.target.value) || 0;
                          setLines(n);
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 text-right text-teal-400 rounded font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) => {
                          const n = [...lines];
                          n[idx].credit = parseFloat(e.target.value) || 0;
                          setLines(n);
                        }}
                        className="w-full p-1.5 bg-slate-950 border border-slate-800 text-right text-teal-400 rounded font-bold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900/80 font-bold border-t border-slate-700">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase">Totales:</td>
                  <td className="p-3 text-right text-teal-400">${totalDebit.toLocaleString()}</td>
                  <td className="p-3 text-right text-teal-400">${totalCredit.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleAddLine}
              className="px-4 py-2 font-mono text-xs text-slate-300 border border-slate-700 hover:bg-slate-800 rounded"
            >
              + Agregar Línea
            </button>

            <button
              onClick={handleSaveVoucher}
              disabled={!isBalanced}
              className="px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded transition-all"
            >
              Asentar Comprobante
            </button>
          </div>
        </div>
      )}

      {/* Content 3: PUC Catalog */}
      {activeTab === 'puc' && (
        <div className="ds-card space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" /> Plan Único de Cuentas (PUC) Comercial Colombia
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
              <span className="text-xs text-teal-400 font-mono">CLASE 1</span>
              <h3 className="text-sm font-bold text-white mt-1">Activo</h3>
              <p className="text-[11px] text-slate-400 mt-1">Caja, Bancos, Cuentas por Cobrar, Inventarios</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
              <span className="text-xs text-teal-400 font-mono">CLASE 2</span>
              <h3 className="text-sm font-bold text-white mt-1">Pasivo</h3>
              <p className="text-[11px] text-slate-400 mt-1">Proveedores, Obligaciones Financieras, Impuestos</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
              <span className="text-xs text-teal-400 font-mono">CLASE 3</span>
              <h3 className="text-sm font-bold text-white mt-1">Patrimonio</h3>
              <p className="text-[11px] text-slate-400 mt-1">Capital Social, Reservas, Utilidades del Ejercicio</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
              <span className="text-xs text-teal-400 font-mono">CLASE 4</span>
              <h3 className="text-sm font-bold text-white mt-1">Ingresos</h3>
              <p className="text-[11px] text-slate-400 mt-1">Ventas de Servicios de Marketing, Software y POS</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
