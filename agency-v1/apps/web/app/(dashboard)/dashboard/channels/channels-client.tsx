'use client';

import { useState } from 'react';
import { 
  Building2, 
  Map, 
  Settings2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Package, 
  Truck,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';

interface ChannelConfig {
  id: string;
  name: string;
  type: 'B2B' | 'RETAIL' | 'E-COMMERCE' | 'DSD';
  packagingCostPct: number;
  storageFixedCost: number;
  freightCostPct: number;
  minMarginFloorPct: number;
}

const initialChannels: ChannelConfig[] = [
  { id: 'ch-1', name: 'Distribuidor Mayorista (B2B)', type: 'B2B', packagingCostPct: 2.5, storageFixedCost: 500000, freightCostPct: 4.0, minMarginFloorPct: 22.0 },
  { id: 'ch-2', name: 'Tiendas Retail Físicas', type: 'RETAIL', packagingCostPct: 1.5, storageFixedCost: 200000, freightCostPct: 2.0, minMarginFloorPct: 28.0 },
  { id: 'ch-3', name: 'Tienda en Línea (Web)', type: 'E-COMMERCE', packagingCostPct: 6.0, storageFixedCost: 150000, freightCostPct: 8.5, minMarginFloorPct: 35.0 },
];

const mockSkuData = [
  { sku: 'CAF-500G-ESP', name: 'Café Especial 500g', region: 'Antioquia', channel: 'E-COMMERCE', basePrice: 45000, costOfGoods: 18000, qtySold: 1250 },
  { sku: 'CAF-500G-ESP', name: 'Café Especial 500g', region: 'Bogotá', channel: 'B2B', basePrice: 38000, costOfGoods: 18000, qtySold: 4500 },
  { sku: 'CACAO-250G', name: 'Cacao Orgánico 250g', region: 'Costa', channel: 'RETAIL', basePrice: 25000, costOfGoods: 12000, qtySold: 2100 },
  { sku: 'CACAO-250G', name: 'Cacao Orgánico 250g', region: 'Bogotá', channel: 'E-COMMERCE', basePrice: 28000, costOfGoods: 12000, qtySold: 850 },
];

export function ChannelsClient() {
  const [activeTab, setActiveTab] = useState<'logistics' | 'profitability' | 'regional'>('logistics');
  const [channels, setChannels] = useState<ChannelConfig[]>(initialChannels);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string, message: string} | null>(null);

  // Filtros Tablero Regional
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterChannel, setFilterChannel] = useState('ALL');

  const formatCOP = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  const handleUpdateChannel = (id: string, field: keyof ChannelConfig, value: number) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const handleSyncApis = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setToastMsg({ title: 'Sincronización Exitosa', message: 'Las tarifas logísticas se han actualizado vía API (FedEx, Coordinadora).' });
    }, 1500);
  };

  // Calcular impacto de rentabilidad con los costos logísticos actuales
  const profitabilityAnalysis = channels.map(ch => {
    const totalVariableLogisticPct = ch.packagingCostPct + ch.freightCostPct;
    // Base simulation: Assume average product price 50000, COGS 20000 (Base Gross Margin 60%)
    const avgPrice = 50000;
    const avgCogs = 20000;
    
    const baseGrossMarginPct = ((avgPrice - avgCogs) / avgPrice) * 100; // 60%
    const fixedStorageImpactPct = (ch.storageFixedCost / 10000000) * 100; // Est. impact based on 10M revenue
    
    const netMarginPct = baseGrossMarginPct - totalVariableLogisticPct - fixedStorageImpactPct;
    const isUnderFloor = netMarginPct < ch.minMarginFloorPct;

    return {
      channelName: ch.name,
      baseGrossMargin: baseGrossMarginPct,
      netMargin: netMarginPct,
      minFloor: ch.minMarginFloorPct,
      isUnderFloor
    };
  });

  const filteredSkuData = mockSkuData.filter(item => 
    (filterRegion === 'ALL' || item.region === filterRegion) &&
    (filterChannel === 'ALL' || item.channel === filterChannel)
  ).map(item => {
    const ch = channels.find(c => c.type === item.channel);
    const logisticsVarPct = ch ? (ch.packagingCostPct + ch.freightCostPct) : 0;
    const logisticsVarCost = item.basePrice * (logisticsVarPct / 100);
    const fixedAlloc = ch ? (ch.storageFixedCost / 10000) : 0; // arbitrary allocation per unit
    const netCost = item.costOfGoods + logisticsVarCost + fixedAlloc;
    const netProfit = item.basePrice - netCost;
    const netMarginPct = (netProfit / item.basePrice) * 100;
    
    return {
      ...item,
      logisticsCost: logisticsVarCost + fixedAlloc,
      netProfit,
      netMarginPct
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Canales y Logística (Omnichannel Margins)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Parametrización de costos logísticos, protección de márgenes y análisis regional por SKU.
          </p>
        </div>
        
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('logistics')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ' + (activeTab === 'logistics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}
          >
            <Settings2 className="w-3.5 h-3.5" /> Parametrización Logística
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ' + (activeTab === 'profitability' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Reglas de Salvaguarda
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={'px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ' + (activeTab === 'regional' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200')}
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" /> Tablero Regional por SKU
          </button>
        </div>
      </div>

      {/* TAB 1: LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Ajusta los costos logísticos por canal de distribución. Los cambios afectarán la rentabilidad neta automáticamente.</p>
            <button 
              onClick={handleSyncApis}
              disabled={isSyncing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all"
            >
              <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin text-indigo-400' : ''}\`} />
              {isSyncing ? 'Sincronizando APIs...' : 'Sincronizar APIs Logísticas'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {channels.map(ch => (
              <div key={ch.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{ch.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{ch.type}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Package className="w-3.5 h-3.5" /> % Costo de Empaque (Packaging)
                    </label>
                    <input 
                      type="number" step="0.1" 
                      value={ch.packagingCostPct} 
                      onChange={(e) => handleUpdateChannel(ch.id, 'packagingCostPct', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Building2 className="w-3.5 h-3.5" /> $ Costo Fijo de Almacenamiento Local
                    </label>
                    <input 
                      type="number" step="10000" 
                      value={ch.storageFixedCost} 
                      onChange={(e) => handleUpdateChannel(ch.id, 'storageFixedCost', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-3.5 h-3.5" /> % Costo Variable de Flete (Freight)
                    </label>
                    <input 
                      type="number" step="0.1" 
                      value={ch.freightCostPct} 
                      onChange={(e) => handleUpdateChannel(ch.id, 'freightCostPct', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-indigo-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PROFITABILITY & MARGIN GUARDS */}
      {activeTab === 'profitability' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Simulador de Reglas de Salvaguarda (Net Margin)
            </h3>
            <p className="text-xs text-slate-400 mb-6">Comparación del Margen Bruto Base frente al Margen Neto tras deducir costos logísticos parametrizados. Alertas si cae por debajo del Piso Mínimo.</p>
            
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={profitabilityAnalysis} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="channelName" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => \`\${val}%\`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} formatter={(val: number) => \`\${val.toFixed(2)}%\`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="baseGrossMargin" name="Margen Bruto Base (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} opacity={0.5} />
                  <Bar dataKey="netMargin" name="Margen Neto Proyectado (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line type="step" dataKey="minFloor" name="Piso Margen Mínimo (%)" stroke="#f59e0b" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {profitabilityAnalysis.map((res, i) => (
                res.isUnderFloor && (
                  <div key={i} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-400">Alerta de Rentabilidad en {res.channelName}</h4>
                      <p className="text-xs text-rose-300/80">El Margen Neto ({res.netMargin.toFixed(1)}%) es inferior al Piso Mínimo permitido ({res.minFloor}%). Ajuste los costos logísticos o suba precios.</p>
                    </div>
                  </div>
                )
              ))}
              {profitabilityAnalysis.every(r => !r.isUnderFloor) && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">Rentabilidad Protegida</h4>
                    <p className="text-xs text-emerald-300/80">Todos los canales cumplen con las reglas de salvaguarda del margen mínimo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGIONAL ANALYSIS */}
      {activeTab === 'regional' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Map className="w-5 h-5 text-indigo-400" />
                  Tablero de Análisis Regional por SKU
                </h3>
                <p className="text-xs text-slate-400 mt-1">Desglose de rentabilidad neta deduciendo costos de venta y logística local.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select className="bg-transparent text-xs text-slate-200 outline-none" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                    <option value="ALL">Todas las Regiones</option>
                    <option value="Antioquia">Antioquia</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Costa">Costa</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select className="bg-transparent text-xs text-slate-200 outline-none" value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
                    <option value="ALL">Todos los Canales</option>
                    <option value="B2B">B2B (Mayorista)</option>
                    <option value="RETAIL">Retail</option>
                    <option value="E-COMMERCE">E-Commerce</option>
                  </select>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="p-3 font-semibold border-b border-slate-800">SKU / Producto</th>
                    <th className="p-3 font-semibold border-b border-slate-800">Región</th>
                    <th className="p-3 font-semibold border-b border-slate-800">Canal</th>
                    <th className="p-3 font-semibold border-b border-slate-800 text-right">Precio Base</th>
                    <th className="p-3 font-semibold border-b border-slate-800 text-right">Costo Logístico</th>
                    <th className="p-3 font-semibold border-b border-slate-800 text-right">Beneficio Neto</th>
                    <th className="p-3 font-semibold border-b border-slate-800 text-right">Margen Neto %</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/40 text-slate-300">
                  {filteredSkuData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-medium text-white flex flex-col">
                        <span>{row.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{row.sku}</span>
                      </td>
                      <td className="p-3">{row.region}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">{row.channel}</span></td>
                      <td className="p-3 text-right font-mono">{formatCOP(row.basePrice)}</td>
                      <td className="p-3 text-right font-mono text-rose-400">-{formatCOP(row.logisticsCost)}</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">{formatCOP(row.netProfit)}</td>
                      <td className="p-3 text-right font-bold">
                        <span className={\`\${row.netMarginPct < 25 ? 'text-amber-400' : 'text-emerald-400'}\`}>
                          {row.netMarginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSkuData.length === 0 && (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-500">No se encontraron datos para los filtros seleccionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 rounded-xl p-4 flex items-start gap-3 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white">{toastMsg.title}</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">{toastMsg.message}</p>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-500 hover:text-slate-300 ml-2">&times;</button>
        </div>
      )}
    </div>
  );
}
