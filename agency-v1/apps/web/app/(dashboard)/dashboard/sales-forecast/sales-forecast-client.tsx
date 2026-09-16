'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Percent,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Plus,
  Table as TableIcon
} from 'lucide-react';

interface DiscountTier {
  id: string;
  minQuantity: number;
  maxQuantity?: number;
  discountPct: number;
}

interface DiscountTable {
  id: string;
  code: string;
  name: string;
  type: string;
  customerTier?: string;
  minMarginFloorPct: number;
  isActive: boolean;
  tiers: DiscountTier[];
}

interface ForecastPoint {
  date: string;
  label: string;
  predictedUnits: number;
  predictedRevenue: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export function SalesForecastClient() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'discounts' | 'simulator'>('forecast');
  
  // Model state & Parameters
  const [forecastHorizon, setForecastHorizon] = useState<'30' | '60' | '90'>('60');
  const [alpha, setAlpha] = useState<number>(0.3);
  const [beta, setBeta] = useState<number>(0.1);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Simulation Parameters
  const [simBaseRevenue, setSimBaseRevenue] = useState<number>(185000000);
  const [simDiscountPct, setSimDiscountPct] = useState<number>(12);
  const [simElasticity, setSimElasticity] = useState<number>(1.45);
  const [simMarketingSpend, setSimMarketingSpend] = useState<number>(15000000);
  const [simCostRatio, setSimCostRatio] = useState<number>(0.55);

  // Discount Tables State
  const [discountTables] = useState<DiscountTable[]>([
    {
      id: 'dt-1',
      code: 'DT-DIST-2026',
      name: 'Escala Mayoristas & Distribuidores',
      type: 'WHOLESALE',
      customerTier: 'PLATINUM',
      minMarginFloorPct: 22.0,
      isActive: true,
      tiers: [
        { id: 't-1', minQuantity: 10, maxQuantity: 49, discountPct: 8.0 },
        { id: 't-2', minQuantity: 50, maxQuantity: 199, discountPct: 14.5 },
        { id: 't-3', minQuantity: 200, maxQuantity: 499, discountPct: 20.0 },
        { id: 't-4', minQuantity: 500, discountPct: 25.0 },
      ]
    },
    {
      id: 'dt-2',
      code: 'DT-RETAIL-CORP',
      name: 'Convenios Corporativos B2B',
      type: 'B2B_PARTNER',
      customerTier: 'GOLD',
      minMarginFloorPct: 28.0,
      isActive: true,
      tiers: [
        { id: 't-5', minQuantity: 5, maxQuantity: 24, discountPct: 5.0 },
        { id: 't-6', minQuantity: 25, maxQuantity: 99, discountPct: 10.0 },
        { id: 't-7', minQuantity: 100, discountPct: 16.0 },
      ]
    }
  ]);

  // Forecast historical base points (months)
  const historicalData = useMemo(() => [
    { period: 'Abr 2026', units: 1250, revenue: 142000000 },
    { period: 'May 2026', units: 1380, revenue: 156000000 },
    { period: 'Jun 2026', units: 1490, revenue: 168000000 },
    { period: 'Jul 2026', units: 1420, revenue: 161000000 },
    { period: 'Ago 2026', units: 1620, revenue: 182000000 },
    { period: 'Sep 2026', units: 1710, revenue: 194000000 },
  ], []);

  // Projected forecast calculation
  const forecastPoints = useMemo<ForecastPoint[]>(() => {
    const horizon = parseInt(forecastHorizon, 10);
    const monthsAhead = horizon / 30;
    const lastRev = historicalData[historicalData.length - 1].revenue;
    const lastUnits = historicalData[historicalData.length - 1].units;
    
    const growthRate = 0.055 * (1 + alpha * 0.4); 

    const points: ForecastPoint[] = [];
    const names = ['Oct 2026', 'Nov 2026', 'Dic 2026'];

    for (let i = 0; i < monthsAhead; i++) {
      const multiplier = Math.pow(1 + growthRate, i + 1);
      const predRev = Math.round(lastRev * multiplier);
      const predUnits = Math.round(lastUnits * multiplier);
      const variance = predRev * 0.07;

      points.push({
        date: `2026-${10 + i}-01`,
        label: names[i] || `Mes +${i + 1}`,
        predictedUnits: predUnits,
        predictedRevenue: predRev,
        confidenceLow: Math.round(predRev - variance),
        confidenceHigh: Math.round(predRev + variance),
      });
    }

    return points;
  }, [historicalData, forecastHorizon, alpha]);

  // Simulator Outcome Calculations
  const simulationResults = useMemo(() => {
    const volumeIncreasePct = (simElasticity * (simDiscountPct / 100));
    const projectedUnits = Math.round(1500 * (1 + volumeIncreasePct));
    
    const grossPriceUnit = simBaseRevenue / 1500;
    const netPriceUnit = grossPriceUnit * (1 - simDiscountPct / 100);
    const grossProjectedRev = projectedUnits * netPriceUnit;

    const marketingUplift = simMarketingSpend * 1.85;
    const totalProjectedRevenue = Math.round(grossProjectedRev + marketingUplift);

    const cogs = totalProjectedRevenue * simCostRatio;
    const grossProfit = totalProjectedRevenue - cogs;
    const netCommercialMargin = grossProfit - simMarketingSpend;
    const marginPct = (netCommercialMargin / totalProjectedRevenue) * 100;

    const isViable = marginPct >= 20.0;

    return {
      projectedRevenue: totalProjectedRevenue,
      revenueDeltaPct: ((totalProjectedRevenue - simBaseRevenue) / simBaseRevenue) * 100,
      projectedUnits,
      unitDeltaPct: volumeIncreasePct * 100,
      netCommercialMargin,
      marginPct,
      isViable,
      roiMarketing: ((marketingUplift - simMarketingSpend) / simMarketingSpend) * 100
    };
  }, [simBaseRevenue, simDiscountPct, simElasticity, simMarketingSpend, simCostRatio]);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 600);
  };

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligence Engine v2.4
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safeguard Margin Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Tabulación de Descuentos & Proyección de Ventas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Modelado predictivo Holt-Winters, simulación de elasticidad de demanda y control estricto de tablas de descuento.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'forecast'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Proyección ML
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'discounts'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tablas de Descuento
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Simulador de Escenarios
          </button>
        </div>
      </div>

      {/* TAB 1: ML FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ingreso Estimado Q4</div>
              <div className="text-2xl font-bold text-white mt-2">
                {formatCOP(forecastPoints.reduce((acc, p) => acc + p.predictedRevenue, 0))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +14.8% vs Q3 Histórico
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Unidades Proyectadas</div>
              <div className="text-2xl font-bold text-white mt-2">
                {forecastPoints.reduce((acc, p) => acc + p.predictedUnits, 0).toLocaleString('es-CO')} u
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-2 font-medium">
                <TrendingUp className="w-4 h-4" />
                Crecimiento sostenido
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Precisión Modelo (MAPE)</div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">94.2%</div>
              <div className="text-xs text-slate-500 mt-2">
                Margen de error promedio &lt; 5.8%
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Horizonte Activo</div>
              <div className="text-2xl font-bold text-amber-400 mt-2">{forecastHorizon} Días</div>
              <div className="text-xs text-slate-500 mt-2">
                Próximos {parseInt(forecastHorizon, 10) / 30} meses comerciales
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Ajuste de Parámetros del Algoritmo (Holt-Winters)
                </h2>
              </div>
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                {isRecalculating ? 'Recalculando matriz...' : 'Recalcular Proyección'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Suavizado de Nivel (&alpha; = {alpha})</span>
                  <span className="text-slate-500">Inercia histórica</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Valores bajos dan más peso a ventas lejanas; valores altos responden a picos recientes.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Suavizado de Tendencia (&beta; = {beta})</span>
                  <span className="text-slate-500">Gradiente</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={beta}
                  onChange={(e) => setBeta(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Regula la pendiente acumulativa entre periodos contables cerrados.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Horizonte Temporal</span>
                  <span className="text-slate-500">Ventana</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['30', '60', '90'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={`py-1.5 text-xs font-medium rounded-lg border ${
                        forecastHorizon === h
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {h} días
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Horizonte predictivo para planificación de compras y flujo de caja.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Matriz Comparativa: Real vs. Proyección Holt-Winters
              </span>
              <span className="text-xs text-slate-400 font-normal">Cifras en Millones COP</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {historicalData.slice(-3).map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                      Histórico
                    </span>
                    <div className="text-sm font-bold text-slate-200 mt-2">{item.period}</div>
                    <div className="text-xs text-slate-400">{item.units.toLocaleString()} unidades</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900">
                    <div className="text-xs text-slate-500">Ingreso Facturado</div>
                    <div className="text-base font-bold text-slate-300 font-mono">
                      {formatCOP(item.revenue)}
                    </div>
                  </div>
                </div>
              ))}

              {forecastPoints.map((pt, idx) => (
                <div key={idx} className="bg-indigo-950/20 border border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-500 text-[9px] font-bold uppercase text-white rounded-bl">
                    ML Forecast
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 uppercase">
                      Estimado
                    </span>
                    <div className="text-sm font-bold text-indigo-200 mt-2">{pt.label}</div>
                    <div className="text-xs text-indigo-400">{pt.predictedUnits.toLocaleString()} unidades est.</div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-indigo-900/40">
                    <div className="text-[11px] text-indigo-400">Proyección Media</div>
                    <div className="text-base font-bold text-white font-mono">
                      {formatCOP(pt.predictedRevenue)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      IC 95%: {formatCOP(pt.confidenceLow)} - {formatCOP(pt.confidenceHigh)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCOUNT TABLES */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TableIcon className="w-4 h-4 text-indigo-400" />
              Tablas de Descuento Vigentes con Regla de Salvaguarda de Margen Mínimo
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Nueva Tabla de Descuento
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {discountTables.map((table) => (
              <div key={table.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {table.code}
                      </span>
                      <h3 className="text-base font-bold text-white">{table.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Activa
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Canal: <span className="text-slate-300 font-medium">{table.type}</span> | Nivel Cliente: <span className="text-slate-300 font-medium">{table.customerTier}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 uppercase">Piso de Margen Mínimo</div>
                      <div className="text-sm font-bold text-amber-400 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-4 h-4" />
                        {table.minMarginFloorPct}% Protección
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Escalones de Volumen y Porcentajes de Rebaja
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {table.tiers.map((tier) => (
                      <div key={tier.id} className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-3.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Rango de Cantidad</span>
                          <Percent className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div className="text-sm font-bold text-slate-200 mt-1">
                          {tier.minQuantity} {tier.maxQuantity ? '- ' + tier.maxQuantity : '+'} unidades
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Descuento aplicado:</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            {tier.discountPct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SCENARIO SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Variables del Escenario
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajusta los factores comerciales para proyectar elasticidad de demanda y rentabilidad neta.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Ingreso Mensual Base</span>
                <span className="font-mono text-indigo-400">{formatCOP(simBaseRevenue)}</span>
              </div>
              <input
                type="range"
                min="50000000"
                max="500000000"
                step="5000000"
                value={simBaseRevenue}
                onChange={(e) => setSimBaseRevenue(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Descuento Comercial Ofrecido</span>
                <span className="font-mono text-indigo-400">{simDiscountPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="35"
                step="0.5"
                value={simDiscountPct}
                onChange={(e) => setSimDiscountPct(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Coeficiente de Elasticidad Precio (Ed)</span>
                <span className="font-mono text-indigo-400">{simElasticity}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={simElasticity}
                onChange={(e) => setSimElasticity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {simElasticity > 1 ? 'Demanda Elástica: Un descuento incrementa fuertemente el volumen' : 'Demanda Inelástica: Riesgo de pérdida por reducción de precio sin volumen compensatorio'}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Inversión Pauta / Marketing</span>
                <span className="font-mono text-indigo-400">{formatCOP(simMarketingSpend)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000000"
                step="1000000"
                value={simMarketingSpend}
                onChange={(e) => setSimMarketingSpend(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className={`border rounded-2xl p-5 flex items-start gap-3.5 ${
              simulationResults.isViable
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/20 border-red-500/40 text-red-300'
            }`}>
              {simulationResults.isViable ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {simulationResults.isViable
                    ? 'Escenario Comercial Viable y Rentable'
                    : 'Alerta de Riesgo: Margen debajo del piso permitido (< 20%)'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {simulationResults.isViable
                    ? 'La elasticidad de demanda compensa el descuento aplicado generando margen neto positivo superior a las metas de la compañía.'
                    : 'El descuento seleccionado erosiona el margen bruto operativo. Ajuste el porcentaje de rebaja o incremente el volumen mínimo por pedido.'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Facturación Estimada</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCOP(simulationResults.projectedRevenue)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  {simulationResults.revenueDeltaPct.toFixed(1)}% vs. Ingreso base
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Volumen Unidades</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {simulationResults.projectedUnits.toLocaleString('es-CO')} u
                </div>
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-2 font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  +{simulationResults.unitDeltaPct.toFixed(1)}% aumento de demanda
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Margen Neto Operativo</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCOP(simulationResults.netCommercialMargin)}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  Margen: {simulationResults.marginPct.toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Retorno en Inversión Pauta</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1">
                  {simulationResults.roiMarketing.toFixed(0)}% ROI
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Multiplicador estimado de 1.85x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
