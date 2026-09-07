'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  Boxes, 
  Calculator, 
  Building2, 
  CheckCircle2, 
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateFixedAssetDepreciationAction } from '@/modules/accounting/actions/accounting';

interface TreasuryKardexModuleProps {
  bankStatementData: any;
  inventoryItems: any[];
  kardexMovements: any[];
  inventoryValuation: number;
  initialAssetResult: any;
  onRefresh: () => void;
}

export function TreasuryKardexModule({
  bankStatementData,
  inventoryItems,
  kardexMovements,
  inventoryValuation,
  initialAssetResult,
  onRefresh,
}: TreasuryKardexModuleProps) {
  const [subTab, setSubTab] = useState<'bank_statement' | 'kardex' | 'fixed_assets'>('bank_statement');

  // Fixed Asset Simulator State
  const [assetName, setAssetName] = useState('Servidores e Infraestructura TI');
  const [assetCost, setAssetCost] = useState(15000000);
  const [assetSalvage, setAssetSalvage] = useState(1500000);
  const [assetLifeMonths, setAssetLifeMonths] = useState(60);
  const [assetResult, setAssetResult] = useState<any>(initialAssetResult);
  const [isDepreciating, setIsDepreciating] = useState(false);

  const handleDepreciateAsset = async () => {
    setIsDepreciating(true);
    try {
      const res = await calculateFixedAssetDepreciationAction({
        assetName,
        cost: assetCost,
        salvageValue: assetSalvage,
        usefulLifeMonths: assetLifeMonths,
      });
      setAssetResult(res);
      toast.success('Depreciación de activo calculada');
    } catch (e) {
      toast.error('Error calculando depreciación');
    } finally {
      setIsDepreciating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setSubTab('bank_statement')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'bank_statement'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-teal-400" />
          Extractos & Conciliación Bancaria
        </button>
        <button
          onClick={() => setSubTab('kardex')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'kardex'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-teal-400" />
          Inventarios & Kardex Permanente NIIF
        </button>
        <button
          onClick={() => setSubTab('fixed_assets')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'fixed_assets'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-teal-400" />
          Depreciación de Activos Fijos
        </button>
      </div>

      {/* ── 1. EXTRACTOS BANCARIOS SUB-TAB ── */}
      {subTab === 'bank_statement' && (
        <div className="ds-card p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-400" />
                Conciliación Automática de Extractos Bancarios (OFX / CSV)
              </h3>
              <p className="text-xs text-slate-400">Detección inteligente de movimientos bancarios y cruce automático con Recibos de Caja (RC) y Comprobantes de Egreso (CE).</p>
            </div>
            <button 
              onClick={onRefresh}
              className="px-3 py-1.5 bg-slate-900 text-teal-400 border border-slate-800 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refrescar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Referencia Transacción</th>
                  <th className="pb-3">Descripción / Concepto</th>
                  <th className="pb-3">Doc Sugerido</th>
                  <th className="pb-3">Cuenta Contable</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3 text-center">Estado Conciliación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bankStatementData?.transactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-slate-400">{tx.date}</td>
                    <td className="py-3 font-bold text-white">{tx.reference}</td>
                    <td className="py-3 text-slate-200 font-sans">{tx.description}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-400 font-bold text-[10px] border border-teal-800/40">
                        {tx.suggestedDocumentType}
                      </span>
                    </td>
                    <td className="py-3 text-teal-400">{tx.suggestedAccount}</td>
                    <td className={`py-3 text-right font-bold ${tx.type === 'CREDITO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'CREDITO' ? `+$${tx.amount?.toLocaleString()}` : `-$${tx.amount?.toLocaleString()}`}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        ✓ AUTO-CONCILIADO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. KARDEX NIIF SUB-TAB ── */}
      {subTab === 'kardex' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="ds-card p-5 border-teal-500/30 bg-teal-950/20">
              <span className="text-[10px] text-teal-300 uppercase font-bold">Valuación Total de Inventario NIIF (Cuenta 1435)</span>
              <p className="text-2xl font-black text-emerald-400 mt-2">${inventoryValuation?.toLocaleString()} COP</p>
              <span className="text-xs text-slate-400">Método: Promedio Ponderado</span>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Ítems en Catálogo</span>
              <p className="text-2xl font-black text-white mt-2">{inventoryItems.length} SKUs</p>
              <span className="text-xs text-slate-400">Control permanente de existencias</span>
            </div>
            <div className="ds-card p-5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Movimientos de Kardex Registrados</span>
              <p className="text-2xl font-black text-teal-400 mt-2">{kardexMovements.length} Entradas / Salidas</p>
              <span className="text-xs text-slate-400">Costo de Ventas (6135) sincronizado</span>
            </div>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-400" />
              Catálogo de Productos & Valuación de Stock
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Nombre del Producto / Servicio</th>
                    <th className="pb-3">Categoría</th>
                    <th className="pb-3 text-right">Existencias</th>
                    <th className="pb-3 text-right">Costo Promedio</th>
                    <th className="pb-3 text-right">Precio Venta</th>
                    <th className="pb-3 text-right">Valor Total Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inventoryItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-bold text-teal-400">{item.sku}</td>
                      <td className="py-3 text-white font-sans">{item.name}</td>
                      <td className="py-3 text-slate-400">{item.category}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">{item.stock} {item.unit}</td>
                      <td className="py-3 text-right text-slate-300">${item.averageCost?.toLocaleString()}</td>
                      <td className="py-3 text-right text-white font-bold">${item.salePrice?.toLocaleString()}</td>
                      <td className="py-3 text-right font-black text-teal-300">${item.totalValuation?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. ACTIVOS FIJOS SUB-TAB ── */}
      {subTab === 'fixed_assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-400" />
              Simulador de Depreciación de Activos Fijos (Línea Recta NIIF)
            </h3>
            <p className="text-xs text-slate-400">
              Cálculo de alícuota mensual de depreciación y asiento sugerido para la cuenta 1592 (Depreciación Acumulada).
            </p>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Nombre del Activo Fijo</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs mt-1 outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Costo Histórico (COP)</label>
                <input
                  type="number"
                  value={assetCost}
                  onChange={(e) => setAssetCost(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase">Valor Residual (Salvamento)</label>
                <input
                  type="number"
                  value={assetSalvage}
                  onChange={(e) => setAssetSalvage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase">Vida Útil (Meses)</label>
              <input
                type="number"
                value={assetLifeMonths}
                onChange={(e) => setAssetLifeMonths(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-xs mt-1 outline-none"
              />
            </div>

            <button
              onClick={handleDepreciateAsset}
              disabled={isDepreciating}
              className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
            >
              {isDepreciating ? 'Calculando...' : 'Calcular Alícuota de Depreciación'}
            </button>
          </div>

          <div className="ds-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Resultado de Depreciación NIIF</h3>

            {assetResult ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 bg-teal-950/20 border border-teal-500/30 rounded-xl space-y-2">
                  <span className="text-[10px] text-teal-400 font-bold uppercase">ALÍCUOTA MENSUAL ESTIMADA</span>
                  <p className="text-3xl font-black text-emerald-400">${assetResult.monthlyDepreciation?.toLocaleString()} COP / mes</p>
                  <p className="text-slate-400 text-xs">Depreciación anual: ${assetResult.annualDepreciation?.toLocaleString()} COP</p>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ASIENTO CONTABLE SUGERIDO (PUC)</span>
                  <div className="divide-y divide-slate-800/80 pt-1">
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-300">5160 - Gasto Depreciación</span>
                      <span className="font-bold text-emerald-400">Débito: ${assetResult.monthlyDepreciation?.toLocaleString()}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="text-slate-300">1592 - Depreciación Acumulada</span>
                      <span className="font-bold text-rose-400">Crédito: ${assetResult.monthlyDepreciation?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Ingresa los datos del activo y presiona "Calcular".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
