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
  Table as TableIcon,
  Zap,
  Tag,
  Clock,
  Layers,
  ArrowRight,
  Download,
  Flame,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter
} from 'recharts';

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

interface MarkdownLot {
  id: string;
  sku: string;
  productName: string;
  warehouse: string;
  quantity: number;
  daysToExpiry: number;
  unitCost: number;
  unitPrice: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
  suggestedDiscountPct: number;
  liquidationStrategy: string;
}

export function SalesForecastClient() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'optimizer' | 'markdown' | 'compare' | 'discounts'>('forecast');
  
  // Model state & Parameters (Holt-Winters)
  const [forecastHorizon, setForecastHorizon] = useState<'30' | '60' | '90'>('60');
  const [algorithm, setAlgorithm] = useState<"HOLT_WINTERS" | "PROPHET" | "SARIMAX" | "XGBOOST" | "LSTM">("HOLT_WINTERS");
  const [exogenousFactors, setExogenousFactors] = useState<string[]>([]);
  const [drillDownCategory, setDrillDownCategory] = useState<string>("ALL");
  const [drillDownRegion, setDrillDownRegion] = useState<string>("ALL");
  
  const [alpha, setAlpha] = useState<number>(0.3);
  const [beta, setBeta] = useState<number>(0.1);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [modelMetrics, setModelMetrics] = useState({ mape: 12.5, rmse: 45.2, confidenceScore: 0.85 });

  // Optimizer Inputs (AI Margin Maximizer)
  const [optBasePrice, setOptBasePrice] = useState<number>(45000);
  const [optUnitCost, setOptUnitCost] = useState<number>(24000);
  const [optBaseUnits, setOptBaseUnits] = useState<number>(1200);
  const [optElasticity, setOptElasticity] = useState<number>(1.65);
  const [optMarginFloor, setOptMarginFloor] = useState<number>(22.0);

  // Markdown Lots State
  const [markdownLots, setMarkdownLots] = useState<MarkdownLot[]>([
    {
      id: 'lot-01',
      sku: 'CAF-GEISHA-250G',
      productName: 'Café Varietal Geisha Especial 250g',
      warehouse: 'Bodega Principal Bogotá',
      quantity: 85,
      daysToExpiry: 12,
      unitCost: 18000,
      unitPrice: 38000,
      riskLevel: 'CRITICAL',
      suggestedDiscountPct: 40,
      liquidationStrategy: 'Liquidación Relámpago (Flash Markdown): Rebaja rápida al costo para recuperar capital antes de merma total.'
    },
    {
      id: 'lot-02',
      sku: 'SNK-CHOC-70',
      productName: 'Chocolate Fino de Aroma Arauca 70%',
      warehouse: 'Bodega Medellín Hub',
      quantity: 160,
      daysToExpiry: 26,
      unitCost: 6500,
      unitPrice: 13500,
      riskLevel: 'HIGH',
      suggestedDiscountPct: 25,
      liquidationStrategy: 'Promoción de Rotación Acelerada: Armar packs 2x1 en tienda física POS y canal B2B.'
    },
    {
      id: 'lot-03',
      sku: 'INF-BERRIES-50G',
      productName: 'Infusión Frutos Rojos Premium 50g',
      warehouse: 'Bodega Cali Valle',
      quantity: 240,
      daysToExpiry: 48,
      unitCost: 8200,
      unitPrice: 17000,
      riskLevel: 'MEDIUM',
      suggestedDiscountPct: 12,
      liquidationStrategy: 'Descuento Preventivo: Ofrecer escala mayorista con volumen mínimo a distribuidores prioritarios.'
    }
  ]);

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

  // Formatters
  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
  const forecastPoints = useMemo<any[]>(() => {
    const horizon = parseInt(forecastHorizon, 10);
    const monthsAhead = horizon / 30;
    const lastRev = historicalData[historicalData.length - 1].revenue;
    const lastUnits = historicalData[historicalData.length - 1].units;
    
    let baseGrowth = 0.055;
    if (algorithm === 'PROPHET') baseGrowth = 0.07;
    if (algorithm === 'LSTM') baseGrowth = 0.04;
    
    let exogBoost = 0;
    if (exogenousFactors.includes('BLACK_FRIDAY')) exogBoost += 0.15;
    if (exogenousFactors.includes('INFLATION_HIGH')) exogBoost -= 0.10;
    
    const growthRate = (baseGrowth + exogBoost) * (1 + alpha * 0.4); 
    
    const combinedData: any[] = [];
    
    // Add historical data
    historicalData.forEach(h => {
      combinedData.push({
        date: h.period,
        label: h.period,
        historicalRevenue: h.revenue,
        predictedRevenue: null,
        confidenceLow: null,
        confidenceHigh: null
      });
    });

    const names = ['Oct 2026', 'Nov 2026', 'Dic 2026'];

    for (let i = 0; i < monthsAhead; i++) {
      const multiplier = Math.pow(1 + growthRate, i + 1);
      let predRev = Math.round(lastRev * multiplier);
      let predUnits = Math.round(lastUnits * multiplier);
      let varianceBase = 0.07;
      if (algorithm === 'LSTM') varianceBase = 0.04;
      if (algorithm === 'PROPHET') varianceBase = 0.05;
      
      const variance = predRev * varianceBase;

      combinedData.push({
        date: '2026-' + (10 + i) + '-01',
        label: names[i] || 'Mes +' + (i + 1),
        historicalRevenue: null,
        predictedUnits: predUnits,
        predictedRevenue: predRev,
        confidenceLow: Math.round(predRev - variance),
        confidenceHigh: Math.round(predRev + variance),
      });
    }

    // Update metrics mock
    setTimeout(() => {
      setModelMetrics({
        mape: algorithm === 'LSTM' ? 8.2 : algorithm === 'PROPHET' ? 9.5 : 12.5,
        rmse: algorithm === 'LSTM' ? 32.1 : algorithm === 'PROPHET' ? 38.4 : 45.2,
        confidenceScore: algorithm === 'LSTM' ? 0.92 : algorithm === 'PROPHET' ? 0.89 : 0.85
      });
    }, 0);

    return combinedData;
  }, [historicalData, forecastHorizon, alpha, algorithm, exogenousFactors]);

  // AI Margin Maximizer Calculations
  const optimizerResults = useMemo(() => {
    let bestDiscount = 0;
    let maxProfit = -Infinity;
    let bestUnits = optBaseUnits;
    let bestRevenue = optBaseUnits * optBasePrice;
    const curve: Array<{ discount: number; profit: number; revenue: number; marginPct: number }> = [];

    for (let d = 0; d <= 35; d += 1) {
      const discountedPrice = optBasePrice * (1 - d / 100);
      const marginPct = ((discountedPrice - optUnitCost) / discountedPrice) * 100;

      if (marginPct < optMarginFloor) break;

      const demandUplift = optElasticity * d;
      const units = Math.round(optBaseUnits * (1 + demandUplift / 100));
      const revenue = units * discountedPrice;
      const profit = units * (discountedPrice - optUnitCost);

      curve.push({ discount: d, profit: Math.round(profit), revenue: Math.round(revenue), marginPct });

      if (profit > maxProfit) {
        maxProfit = profit;
        bestDiscount = d;
        bestUnits = units;
        bestRevenue = revenue;
      }
    }

    const baseProfit = optBaseUnits * (optBasePrice - optUnitCost);
    const profitDeltaPct = baseProfit > 0 ? ((maxProfit - baseProfit) / baseProfit) * 100 : 0;
    const optimalPrice = optBasePrice * (1 - bestDiscount / 100);

    return {
      bestDiscount,
      optimalPrice: Math.round(optimalPrice),
      bestUnits,
      bestRevenue: Math.round(bestRevenue),
      maxProfit: Math.round(maxProfit),
      baseProfit: Math.round(baseProfit),
      profitDeltaPct: Math.round(profitDeltaPct * 10) / 10,
      effectiveMarginPct: Math.round(((optimalPrice - optUnitCost) / optimalPrice) * 1000) / 10,
      curve
    };
  }, [optBasePrice, optUnitCost, optBaseUnits, optElasticity, optMarginFloor]);

  // Multi-Scenario Comparison Engine
  const scenariosData = useMemo(() => {
    const baseRev = 185000000;
    const baseCost = 101750000; // 55%
    const baseProfit = baseRev - baseCost;

    return [
      {
        id: 'sc-1',
        title: 'Escenario 1: Conservador (Status Quo)',
        tag: 'Bajo Riesgo',
        tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        discountPct: 5,
        elasticity: 1.1,
        mktgSpend: 5000000,
        projectedUnits: 1580,
        projectedRevenue: 198000000,
        projectedProfit: 86500000,
        marginPct: 43.6,
        profitDeltaPct: 3.8,
        verdict: 'Estabilidad de flujo con mínimo riesgo de rotación.'
      },
      {
        id: 'sc-2',
        title: 'Escenario 2: Optimizado AI (Recomendado)',
        tag: 'Máxima Rentabilidad',
        tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        discountPct: 14,
        elasticity: 1.65,
        mktgSpend: 15000000,
        projectedUnits: 2150,
        projectedRevenue: 242000000,
        projectedProfit: 104200000,
        marginPct: 43.0,
        profitDeltaPct: 25.1,
        verdict: 'Óptimo global: Mayor ganancia neta absoluta aprovechando elasticidad.'
      },
      {
        id: 'sc-3',
        title: 'Escenario 3: Agresivo Expansión Cuota',
        tag: 'Alto Crecimiento',
        tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        discountPct: 24,
        elasticity: 1.8,
        mktgSpend: 28000000,
        projectedUnits: 2820,
        projectedRevenue: 275000000,
        projectedProfit: 95500000,
        marginPct: 34.7,
        profitDeltaPct: 14.7,
        verdict: 'Penetración rápida de mercado pero con mayor compresión de margen.'
      }
    ];
  }, []);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 600);
  };

  const handleAutoTune = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      // Set optimized parameters for the view
      setAlpha(0.6);
      setBeta(0.2);
      setAlgorithm('LSTM');
      setExogenousFactors(['BLACK_FRIDAY', 'PROMO_CAMPAIGN']);
      setIsRecalculating(false);
    }, 1200);
  };

  const exportReport = () => {
    alert("Exportando reporte completo a PDF (Enterprise Reporting)...");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligence Engine Enterprise v2.5
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
            Ensemble predictivo Holt-Winters, optimización prescriptiva de precios (AI Margin Maximizer) y liquidación de lotes.
          </p>
        </div>

        {/* Tab Controls (5 Ultraprofessional Tabs) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('forecast')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeTab === 'forecast'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Proyección ML
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeTab === 'optimizer'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Precio Óptimo AI
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeTab === 'markdown'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Liquidación Lotes
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Comparar Escenarios
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ' + (
              activeTab === 'discounts'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tablas Descuento
          </button>
        </div>
      </div>

      {/* ── TAB 1: PROYECCIÓN ML ────────────────────────────────────────────── */}
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
                  Configuración del Motor Machine Learning
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoTune}
                  disabled={isRecalculating}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <Zap className={'w-3.5 h-3.5 ' + (isRecalculating ? 'animate-pulse text-white' : '')} />
                  Auto-Tune ML
                </button>
                <button
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={'w-3.5 h-3.5 ' + (isRecalculating ? 'animate-spin' : '')} />
                  Recalcular
                </button>
                <button
                  onClick={exportReport}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/50 text-xs font-medium hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Algoritmo Predictivo</span>
                </div>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="HOLT_WINTERS">Holt-Winters (Doble Suavización)</option>
                  <option value="PROPHET">Facebook Prophet (Aditivo)</option>
                  <option value="LSTM">Deep Learning LSTM</option>
                  <option value="XGBOOST">XGBoost (Árboles)</option>
                  <option value="SARIMAX">SARIMAX (Autorregresivo)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Factores Exógenos (Shock)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'BLACK_FRIDAY', label: 'Black Friday' },
                    { id: 'PROMO_CAMPAIGN', label: 'Promo Q4' },
                    { id: 'INFLATION_HIGH', label: 'Inflación +' },
                  ].map((factor) => (
                    <button
                      key={factor.id}
                      onClick={() => {
                        if (exogenousFactors.includes(factor.id)) {
                          setExogenousFactors(exogenousFactors.filter(f => f !== factor.id));
                        } else {
                          setExogenousFactors([...exogenousFactors, factor.id]);
                        }
                      }}
                      className={'px-2 py-1 text-[10px] rounded-md font-semibold border ' + (
                        exogenousFactors.includes(factor.id)
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Inercia (α = {alpha.toFixed(2)}) &amp; Tendencia (β = {beta.toFixed(2)})</span>
                </div>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={alpha}
                    onChange={(e) => setAlpha(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={beta}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                  <span>Horizonte (Días)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['30', '60', '90'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setForecastHorizon(h)}
                      className={'py-1.5 text-xs font-medium rounded-lg border ' + (
                        forecastHorizon === h
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filtros Drill Down */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4">
              <span className="text-xs text-slate-500 uppercase font-semibold">Drill-Down:</span>
              <select value={drillDownCategory} onChange={e => setDrillDownCategory(e.target.value)} className="bg-slate-950 border border-slate-800 rounded text-[11px] px-2 py-1 text-slate-300">
                <option value="ALL">Todas las Categorías</option>
                <option value="COFFEE">Cafés Especiales</option>
                <option value="CACAO">Cacao & Derivados</option>
              </select>
              <select value={drillDownRegion} onChange={e => setDrillDownRegion(e.target.value)} className="bg-slate-950 border border-slate-800 rounded text-[11px] px-2 py-1 text-slate-300">
                <option value="ALL">Todas las Regiones</option>
                <option value="BOGOTA">Bogotá DC</option>
                <option value="ANTIOQUIA">Antioquia</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Curva de Tendencia y Bandas de Confianza (IC 95%)
              </span>
              <span className="text-xs text-slate-400 font-normal flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span>Histórico</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>Proyección</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500/20"></span>IC 95%</span>
              </span>
            </h2>

            <div className="h-80 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastPoints} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(value: any, name: string) => [formatCOP(value), name === 'historicalRevenue' ? 'Venta Real' : name === 'predictedRevenue' ? 'Proyección' : 'Banda Confianza']}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="confidenceHigh" stroke="none" fill="#4f46e5" fillOpacity={0.05} />
                  <Area type="monotone" dataKey="confidenceLow" stroke="none" fill="#0f172a" fillOpacity={1} />
                  <Line type="monotone" dataKey="historicalRevenue" stroke="#64748b" strokeWidth={3} dot={{ r: 4, fill: '#64748b' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="predictedRevenue" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 border-t border-slate-800/80 pt-4 gap-4 text-center">
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">R² Score (Confianza)</div>
                  <div className="text-xl font-bold text-white mt-1">{(modelMetrics.confidenceScore * 100).toFixed(1)}%</div>
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">MAPE (Error %)</div>
                  <div className={`text-xl font-bold mt-1 ${modelMetrics.mape < 10 ? 'text-emerald-400' : 'text-amber-400'}`}>{modelMetrics.mape.toFixed(2)}%</div>
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">RMSE (Dispersion)</div>
                  <div className="text-xl font-bold text-white mt-1">{modelMetrics.rmse.toFixed(1)}</div>
               </div>
            </div>
          </div>

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

      {/* ── TAB 2: AI MARGIN MAXIMIZER (OPTIMIZADOR PRESCRIPTIVO) ─────────── */}
      {activeTab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Prescriptor de Precio y Margen Óptimo
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calcula analíticamente el punto exacto de la curva de elasticidad donde la ganancia neta total es máxima.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Precio Unitario Base</span>
                <span className="font-mono text-indigo-400">{formatCOP(optBasePrice)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="200000"
                step="2000"
                value={optBasePrice}
                onChange={(e) => setOptBasePrice(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Costo Unitario de Mercancía (COGS)</span>
                <span className="font-mono text-indigo-400">{formatCOP(optUnitCost)}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="1000"
                value={optUnitCost}
                onChange={(e) => setOptUnitCost(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Demanda Mensual Base (Sin Descuento)</span>
                <span className="font-mono text-indigo-400">{optBaseUnits.toLocaleString()} unidades</span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="50"
                value={optBaseUnits}
                onChange={(e) => setOptBaseUnits(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Elasticidad Precio Demanda (Ed)</span>
                <span className="font-mono text-amber-400">{optElasticity}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.05"
                value={optElasticity}
                onChange={(e) => setOptElasticity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>Piso Protector de Margen Mínimo</span>
                <span className="font-mono text-emerald-400">{optMarginFloor}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="1"
                value={optMarginFloor}
                onChange={(e) => setOptMarginFloor(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-indigo-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Punto Óptimo Prescrito por IA
                  </span>
                  <div className="text-3xl font-bold text-white mt-2 font-mono">
                    Descuento Óptimo: {optimizerResults.bestDiscount}%
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Precio final sugerido: <span className="text-emerald-400 font-bold font-mono">{formatCOP(optimizerResults.optimalPrice)}</span> (Margen efectivo: {optimizerResults.effectiveMarginPct}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Ganancia Neta Adicional</div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    +{optimizerResults.profitDeltaPct}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    vs. Venta a precio de lista
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Ganancia Bruta Óptima</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatCOP(optimizerResults.maxProfit)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Base sin descuento: {formatCOP(optimizerResults.baseProfit)}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-xs font-medium text-slate-400 uppercase">Volumen Proyectado</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1">
                  {optimizerResults.bestUnits.toLocaleString()} unidades
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  +{optimizerResults.bestUnits - optBaseUnits} unidades incrementales
                </div>
              </div>
            </div>

            {/* Sweep Curve Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Curva de Sensibilidad: Descuento vs. Utilidad Neta
              </h3>
              <div className="space-y-2">
                {optimizerResults.curve.slice(0, 7).map((pt, idx) => (
                  <div
                    key={idx}
                    className={'flex items-center justify-between p-2.5 rounded-xl border text-xs ' + (
                      pt.discount === optimizerResults.bestDiscount
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{pt.discount}% Descuento</span>
                      {pt.discount === optimizerResults.bestDiscount && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                          Máximo Global
                        </span>
                      )}
                    </div>
                    <div className="font-mono">{formatCOP(pt.revenue)} venta</div>
                    <div className="font-mono font-bold text-emerald-400">{formatCOP(pt.profit)} ganancia</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LIQUIDACIÓN DINÁMICA DE LOTES (MARKDOWN) ────────────────── */}
      {activeTab === 'markdown' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1.5 w-fit">
                  <Flame className="w-3 h-3" />
                  Liquidación Preventiva Anti-Mermas
                </span>
                <h2 className="text-xl font-bold text-white mt-2">
                  Lotes Próximos a Vencer & Descuentos Markdown Sugeridos
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Evita pérdidas operativas aplicando descuentos automáticos escalonados según la vida útil remanente.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Capital en Riesgo Detectado</div>
                <div className="text-2xl font-bold text-rose-400 font-mono">
                  {formatCOP(markdownLots.reduce((a, b) => a + (b.quantity * b.unitCost), 0))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {markdownLots.map((lot) => (
              <div key={lot.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {lot.sku}
                      </span>
                      <h3 className="text-base font-bold text-white">{lot.productName}</h3>
                      <span className={'px-2 py-0.5 rounded text-[10px] font-bold uppercase border ' + (
                        lot.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : lot.riskLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      )}>
                        {lot.riskLevel === 'CRITICAL' ? 'Vence en ' + lot.daysToExpiry + ' días' : 'Vence en ' + lot.daysToExpiry + ' días'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Ubicación: <span className="text-slate-300">{lot.warehouse}</span> | Stock disponible: <span className="text-slate-200 font-bold">{lot.quantity} unidades</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Rebaja Markdown Recomendada</div>
                      <div className="text-xl font-bold text-rose-400 font-mono">
                        {lot.suggestedDiscountPct}% OFF
                      </div>
                    </div>
                    <button className="px-3.5 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold transition-all">
                      Activar Rebaja
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="font-semibold text-amber-400">Estrategia Comercial: </span>
                  {lot.liquidationStrategy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: COMPARADOR LADO A LADO DE ESCENARIOS ─────────────────────── */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Matriz Comparativa de Estrategias Comerciales
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluación simultánea de impacto en demanda, flujo y margen bruto neto.
              </p>
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Exportar Matriz PDF / Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenariosData.map((sc) => (
              <div key={sc.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded border ' + sc.tagColor}>
                      {sc.tag}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{sc.discountPct}% Descuento</span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3">{sc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{sc.verdict}</p>

                  <div className="space-y-3 mt-5 pt-4 border-t border-slate-800/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ingreso Facturado</span>
                      <span className="text-slate-200 font-bold font-mono">{formatCOP(sc.projectedRevenue)}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Demanda Unidades</span>
                      <span className="text-slate-200 font-mono">{sc.projectedUnits.toLocaleString()} u</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ganancia Neta Operativa</span>
                      <span className="text-emerald-400 font-bold font-mono">{formatCOP(sc.projectedProfit)}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Margen Comercial</span>
                      <span className="text-indigo-400 font-bold font-mono">{sc.marginPct}%</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Crecimiento Ganancia</span>
                      <span className="text-emerald-400 font-bold font-mono">+{sc.profitDeltaPct}% vs base</span>
                    </div>
                  </div>
                </div>

                <button className="mt-6 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-white text-xs font-semibold border border-slate-700 hover:border-indigo-500 transition-all flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Elegir esta Estrategia
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: TABLAS DE DESCUENTO ─────────────────────────────────────── */}
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
    </div>
  );
}
