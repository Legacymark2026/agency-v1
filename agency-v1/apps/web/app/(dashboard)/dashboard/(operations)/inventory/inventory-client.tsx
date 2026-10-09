'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Boxes,
  Warehouse,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  DollarSign,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  Calendar,
  Sparkles,
  ChefHat,
  MapPin,
  ListChecks,
  ClipboardCheck,
  Printer,
  Building2,
  ShieldCheck,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  ArrowUpCircle,
  FileCheck2
} from 'lucide-react';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { SuppliersTab } from './suppliers-tab';

// ── Types ───────────────────────────────────────────────────────────────────

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  city: string;
  isMain: boolean;
  totalSkus: number;
}

interface StockItem {
  id: string;
  sku: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  reserved: number;
  available: number;
  averageCost: number;
  reorderPoint: number;
  status: 'OK' | 'LOW_STOCK' | 'CRITICAL';
}

interface KardexEntry {
  id: string;
  date: string;
  productName: string;
  sku: string;
  type: 'IN_PURCHASE' | 'OUT_SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  reference: string;
  operatorBadgeId?: string;
  signatureHash?: string;
}

interface StorageBinUI {
  id: string;
  binCode: string;
  zone: string;
  aisle: string;
  rack: string;
  shelfLevel: number;
  maxWeightKg: number;
  currentWeightKg: number;
  maxVolumeCm3: number;
  currentVolumeCm3: number;
  utilizationPct: number;
  velocityTier: 'FAST' | 'MEDIUM' | 'SLOW';
}

interface TransferOrder {
  id: string;
  transferNumber: string;
  origin: string;
  destination: string;
  itemsSummary: string;
  date: string;
  status: 'DISPATCHED' | 'RECEIVED' | 'PENDING';
}

interface ProductLotUI {
  id: string;
  sku: string;
  lotNumber: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
  status: 'FRESH' | 'WARNING' | 'EXPIRED';
}

interface BomRecipeUI {
  id: string;
  parentSku: string;
  parentName: string;
  components: { childSku: string; childName: string; quantityRequired: number; unit: string }[];
}

interface DemandForecastUI {
  sku: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysOnHand: number;
  suggestedReorder: number;
  riskLevel: 'OPTIMAL' | 'LOW_STOCK' | 'CRITICAL' | 'OVERSTOCKED';
}

type OperationalPillar = 'stock' | 'logistics' | 'production' | 'governance';
type SubTab = 'stock' | 'kardex' | 'lots' | 'transfers' | 'locations' | 'fulfillment' | 'suppliers' | 'bom' | 'forecast' | 'audit';

// ── Component ───────────────────────────────────────────────────────────────

export function InventoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pillar & Subtab state management with URL sync
  const [activePillar, setActivePillar] = useState<OperationalPillar>('stock');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('stock');

  // Search & Global Warehouse Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SubTab;
    if (tabParam) {
      if (['stock', 'kardex', 'lots'].includes(tabParam)) {
        setActivePillar('stock');
        setActiveSubTab(tabParam);
      } else if (['transfers', 'locations', 'fulfillment'].includes(tabParam)) {
        setActivePillar('logistics');
        setActiveSubTab(tabParam);
      } else if (['suppliers', 'bom', 'forecast'].includes(tabParam)) {
        setActivePillar('production');
        setActiveSubTab(tabParam);
      } else if (['audit'].includes(tabParam)) {
        setActivePillar('governance');
        setActiveSubTab(tabParam);
      }
    }
  }, [searchParams]);

  const setTabWithUrl = (pillar: OperationalPillar, subTab: SubTab) => {
    setActivePillar(pillar);
    setActiveSubTab(subTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', subTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Static / Mock state collections
  const [warehouses] = useState<WarehouseData[]>([
    { id: 'wh-1', name: 'Bodega Central (Cali)', code: 'BOD-CAL', city: 'Cali', isMain: true, totalSkus: 248 },
    { id: 'wh-2', name: 'Tienda Calle 93 (Bogotá)', code: 'POS-BOG', city: 'Bogotá', isMain: false, totalSkus: 142 },
    { id: 'wh-3', name: 'Centro Distribución Medellín', code: 'CED-MED', city: 'Medellín', isMain: false, totalSkus: 195 },
  ]);

  const [stockItems] = useState<StockItem[]>([
    { id: '1', sku: 'ALM-001', name: 'Café Especial Geisha 500g', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 450, reserved: 40, available: 410, averageCost: 28500, reorderPoint: 50, status: 'OK' },
    { id: '2', sku: 'ALM-002', name: 'Miel Orgánica de Bosque 300g', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 18, reserved: 0, available: 18, averageCost: 14200, reorderPoint: 25, status: 'LOW_STOCK' },
    { id: '3', sku: 'ACC-099', name: 'Prensa Francesa Vidrio 600ml', warehouseId: 'wh-2', warehouseName: 'Tienda Calle 93', quantity: 4, reserved: 2, available: 2, averageCost: 45000, reorderPoint: 10, status: 'CRITICAL' },
    { id: '4', sku: 'BEV-010', name: 'Té Matcha Japonés Grado Ceremonial', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 85, reserved: 5, available: 80, averageCost: 38000, reorderPoint: 20, status: 'OK' },
  ]);

  const [kardexEntries] = useState<KardexEntry[]>([
    { id: 'k-1', date: '2026-10-06 14:20', productName: 'Café Especial Geisha 500g', sku: 'ALM-001', type: 'IN_PURCHASE', quantity: 100, unitCost: 28500, totalCost: 2850000, balanceAfter: 450, reference: 'OC-2026-091', operatorBadgeId: 'BADGE-08', signatureHash: '75c71b6c40faac3907cc2e3899f037443dc4c2effa71a4e6921a25007f45ee99' },
    { id: 'k-2', date: '2026-10-06 11:05', productName: 'Prensa Francesa Vidrio', sku: 'ACC-099', type: 'OUT_SALE', quantity: 2, unitCost: 45000, totalCost: 90000, balanceAfter: 4, reference: 'POS-REC-4821', operatorBadgeId: 'POS-TERM-02', signatureHash: 'a8b19e422f1839db0808a94625b182046f2127265ac4c95f0017e81b67f1b212' },
    { id: 'k-3', date: '2026-10-05 16:45', productName: 'Café Especial Geisha 500g', sku: 'ALM-001', type: 'TRANSFER_OUT', quantity: 20, unitCost: 28500, totalCost: 570000, balanceAfter: 350, reference: 'TRF-00190', operatorBadgeId: 'BADGE-14', signatureHash: 'd39a11756e01a93bbbc109f5832a8190589139281a8b030491823901b0f19932' },
  ]);

  const [chaoticBins] = useState<StorageBinUI[]>([
    { id: 'bin-1', binCode: 'Z1-PA-R2-N3', zone: 'Zona Secos A', aisle: 'Pasillo A', rack: 'Rack 2', shelfLevel: 3, maxWeightKg: 500, currentWeightKg: 280, maxVolumeCm3: 500000, currentVolumeCm3: 380000, utilizationPct: 76, velocityTier: 'FAST' },
    { id: 'bin-2', binCode: 'Z1-PA-R1-N1', zone: 'Zona Secos A', aisle: 'Pasillo A', rack: 'Rack 1', shelfLevel: 1, maxWeightKg: 350, currentWeightKg: 95, maxVolumeCm3: 400000, currentVolumeCm3: 120000, utilizationPct: 30, velocityTier: 'FAST' },
    { id: 'bin-3', binCode: 'Z2-PB-R5-N2', zone: 'Zona Fría (15°C)', aisle: 'Pasillo B', rack: 'Rack 5', shelfLevel: 2, maxWeightKg: 200, currentWeightKg: 45, maxVolumeCm3: 250000, currentVolumeCm3: 85000, utilizationPct: 34, velocityTier: 'MEDIUM' },
  ]);

  // Recall Blast Radius Modal
  const [selectedRecallLot, setSelectedRecallLot] = useState<any | null>(null);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

  // RF Scanner Hardware Wedge Simulation state
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [scanFeedbackTone, setScanFeedbackTone] = useState<'SUCCESS' | 'ERROR' | null>(null);

  const [transfers] = useState<TransferOrder[]>([
    { id: 'tr-1', transferNumber: 'TRF-00190', origin: 'Bodega Central (Cali)', destination: 'Tienda Calle 93 (Bogotá)', itemsSummary: '20x Café Geisha, 5x Prensa Francesa', date: '2026-10-05', status: 'RECEIVED' },
    { id: 'tr-2', transferNumber: 'TRF-00191', origin: 'Bodega Central (Cali)', destination: 'Centro Medellín', itemsSummary: '50x Café Geisha, 30x Té Matcha', date: '2026-10-06', status: 'DISPATCHED' },
  ]);

  const [lotItems] = useState<ProductLotUI[]>([
    { id: 'lot-1', sku: 'ALM-001', lotNumber: 'LT-2026-088', productName: 'Café Especial Geisha 500g', warehouseName: 'Bodega Central', quantity: 300, expiryDate: '2027-04-15', daysRemaining: 191, status: 'FRESH' },
    { id: 'lot-2', sku: 'ALM-002', lotNumber: 'LT-2025-012', productName: 'Miel Orgánica Bosque', warehouseName: 'Bodega Central', quantity: 18, expiryDate: '2026-10-25', daysRemaining: 19, status: 'WARNING' },
    { id: 'lot-3', sku: 'RAW-LECHE', lotNumber: 'LT-2026-003', productName: 'Leche Barista Entera UHT', warehouseName: 'Tienda Calle 93', quantity: 6, expiryDate: '2026-10-01', daysRemaining: -5, status: 'EXPIRED' },
  ]);

  const [bomRecipes] = useState<BomRecipeUI[]>([
    {
      id: 'bom-1',
      parentSku: 'BEV-CAPPUCCINO',
      parentName: 'Cappuccino Artesanal 8oz',
      components: [
        { childSku: 'ALM-001', childName: 'Café Geisha Tostado', quantityRequired: 18, unit: 'g' },
        { childSku: 'RAW-LECHE-ENT', childName: 'Leche Entera Barista', quantityRequired: 200, unit: 'ml' },
        { childSku: 'PKG-CUP-8OZ', childName: 'Vaso Biodegradable 8oz con Tapa', quantityRequired: 1, unit: 'un' },
      ]
    },
    {
      id: 'bom-2',
      parentSku: 'KIT-BARISTA-PRO',
      parentName: 'Kit Barista Starter Pack',
      components: [
        { childSku: 'ALM-001', childName: 'Café Especial Geisha 500g', quantityRequired: 2, unit: 'un' },
        { childSku: 'ACC-099', childName: 'Prensa Francesa Borosilicato', quantityRequired: 1, unit: 'un' },
        { childSku: 'ALM-002', childName: 'Miel Orgánica 300ml', quantityRequired: 1, unit: 'un' },
      ]
    }
  ]);

  const [forecastItems] = useState<DemandForecastUI[]>([
    { sku: 'ALM-001', productName: 'Café Especial Geisha 500g', currentStock: 462, averageDailySales: 16.4, daysOnHand: 28.1, suggestedReorder: 0, riskLevel: 'OPTIMAL' },
    { sku: 'ALM-002', productName: 'Miel Orgánica de Bosque', currentStock: 18, averageDailySales: 4.2, daysOnHand: 4.2, suggestedReorder: 85, riskLevel: 'LOW_STOCK' },
    { sku: 'ACC-099', productName: 'Prensa Francesa Vidrio', currentStock: 4, averageDailySales: 1.8, daysOnHand: 2.2, suggestedReorder: 45, riskLevel: 'CRITICAL' },
    { sku: 'BEV-010', productName: 'Té Matcha Japonés', currentStock: 85, averageDailySales: 1.2, daysOnHand: 70.8, suggestedReorder: 0, riskLevel: 'OVERSTOCKED' },
  ]);

  // Calculations
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.averageCost), 0);
  const lowStockCount = stockItems.filter(i => i.status !== 'OK').length;
  const expiringLotsCount = lotItems.filter(l => l.status === 'WARNING' || l.status === 'EXPIRED').length;

  const filteredItems = stockItems.filter(item => {
    const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── Enterprise Header (Quantum Home Style) ── */}
      <InteractiveSpotlight
        className="relative z-10 ds-card group"
        style={{ padding: '2rem 2.5rem' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute top-4 right-4 font-mono text-xs text-slate-600 uppercase tracking-widest">[OPS_INV · WMS]</div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="mb-2">
              <span className="ds-badge ds-badge-teal">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                </span>
                <Sparkles size={8} /> WMS Multisede &amp; Kárdex Ponderado
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white">
              Gestión de{" "}
              <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                Inventario &amp; Bodegas
              </span>
            </h1>
            <p className="ds-subtext mt-1 max-w-3xl">
              Control multisede de existencias, kárdex contable automatizado, trazabilidad FEFO por lotes, ensambles (BOM) y auditorías a ciegas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Global Warehouse Filter */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}
            >
              <Warehouse size={14} className="text-teal-400" />
              <span className="text-slate-400">Sede:</span>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent font-mono text-teal-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-950 text-white">Todas las Sedes (Consolidado)</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id} className="bg-slate-950 text-white">
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest hover:border-teal-500/60 transition"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}
            >
              <ArrowRightLeft size={14} className="text-teal-400" />
              Traslado Inter-Sede
            </button>
            <button
              onClick={() => setIsMovementModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_-5px_rgba(20,184,166,0.4)] transition transform active:scale-95"
            >
              <Plus size={15} />
              Nuevo Movimiento
            </button>
          </div>
        </div>

        {/* ── Contextual KPI Strip (Estilo Home / Dashboard) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-sm bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Valoración Contable</span>
              <DollarSign size={15} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono mt-1 text-white tabular-nums">
              ${totalValue.toLocaleString('es-CO')} <span className="text-[10px] font-mono text-slate-400">COP</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp size={11} className="text-emerald-400" /> Promedio Ponderado
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Sedes Operativas</span>
              <Warehouse size={15} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono mt-1 text-white tabular-nums">
              {warehouses.length} <span className="text-xs font-mono text-slate-400">Bodegas</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              1 Principal · 2 Sucursales activas
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Catálogo de SKUs</span>
              <Package size={15} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black font-mono mt-1 text-white tabular-nums">
              {stockItems.length} <span className="text-xs font-mono text-slate-400">Ítems</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              Sincronización en tiempo real
            </div>
          </div>

          <div className="p-4 rounded-sm bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Riesgo &amp; Reorden</span>
              <AlertTriangle size={15} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono mt-1 text-amber-400 tabular-nums">
              {lowStockCount} <span className="text-xs font-mono text-slate-400">SKUs críticos</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
              <TrendingDown size={11} className="text-amber-400" /> {expiringLotsCount} lotes en alerta FEFO
            </div>
          </div>
        </div>

        {/* ── Architecture Pillars (Primary Tabs) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          {/* Pillar 1 */}
          <button
            onClick={() => setTabWithUrl('stock', 'stock')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activePillar === 'stock'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Existencias &amp; Kárdex</span>
              <Layers size={15} className={activePillar === 'stock' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{stockItems.length}</div>
            <span className="text-[10px] font-mono text-slate-400">Stock, costeo y lotes FEFO</span>
          </button>

          {/* Pillar 2 */}
          <button
            onClick={() => setTabWithUrl('logistics', 'transfers')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activePillar === 'logistics'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Logística &amp; WMS</span>
              <Truck size={15} className={activePillar === 'logistics' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{warehouses.length} Sedes</div>
            <span className="text-[10px] font-mono text-slate-400">Racks, traslados y picking</span>
          </button>

          {/* Pillar 3 */}
          <button
            onClick={() => setTabWithUrl('production', 'bom')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activePillar === 'production'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Producción &amp; MRP</span>
              <ChefHat size={15} className={activePillar === 'production' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">BOM</div>
            <span className="text-[10px] font-mono text-slate-400">Recetas y Demanda IA</span>
          </button>

          {/* Pillar 4 */}
          <button
            onClick={() => setTabWithUrl('governance', 'audit')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activePillar === 'governance'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Auditoría &amp; Control</span>
              <ShieldCheck size={15} className={activePillar === 'governance' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">Kárdex</div>
            <span className="text-[10px] font-mono text-slate-400">Arqueos a ciegas y ajustes</span>
          </button>
        </div>
      </InteractiveSpotlight>

      {/* ── Sub-navigation Pills per Pillar ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Pillar 1 Subtabs */}
          {activePillar === 'stock' && (
            <>
              <button
                onClick={() => setTabWithUrl('stock', 'stock')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'stock'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers size={14} /> Existencias Multisede ({filteredItems.length})
              </button>
              <button
                onClick={() => setTabWithUrl('stock', 'kardex')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'kardex'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <History size={14} /> Kárdex Valorizado
              </button>
              <button
                onClick={() => setTabWithUrl('stock', 'lots')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'lots'
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar size={14} /> Lotes & Vencimientos (FEFO)
                {expiringLotsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                    {expiringLotsCount}
                  </span>
                )}
              </button>
            </>
          )}

          {/* Pillar 2 Subtabs */}
          {activePillar === 'logistics' && (
            <>
              <button
                onClick={() => setTabWithUrl('logistics', 'transfers')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'transfers'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Truck size={14} /> Traslados Inter-Bodegas ({transfers.length})
              </button>
              <button
                onClick={() => setTabWithUrl('logistics', 'locations')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'locations'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin size={14} /> Mapa de Ubicaciones (Racks & Bins)
              </button>
              <button
                onClick={() => setTabWithUrl('logistics', 'fulfillment')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'fulfillment'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <ListChecks size={14} /> Pick, Pack & Ship (Fulfillment)
              </button>
            </>
          )}

          {/* Pillar 3 Subtabs */}
          {activePillar === 'production' && (
            <>
              <button
                onClick={() => setTabWithUrl('production', 'bom')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'bom'
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChefHat size={14} /> Recetas & Ensambles (BOM)
              </button>
              <button
                onClick={() => setTabWithUrl('production', 'forecast')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'forecast'
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles size={14} /> Demanda & Reabastecimiento IA
              </button>
              <button
                onClick={() => router.push('/dashboard/suppliers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 transition ml-auto"
              >
                <Building2 size={13} /> Ir a Portal Proveedores (SRM) →
              </button>
            </>
          )}

          {/* Pillar 4 Subtabs */}
          {activePillar === 'governance' && (
            <>
              <button
                onClick={() => setTabWithUrl('governance', 'audit')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeSubTab === 'audit'
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <ClipboardCheck size={14} /> Auditoría y Arqueo Cíclico
              </button>
            </>
          )}
        </div>

        {/* Global Search Bar (when relevant) */}
        {['stock', 'kardex', 'lots'].includes(activeSubTab) && (
          <div className="relative w-72 hidden sm:block">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por SKU o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* ── Subtab Content Views ────────────────────────────────────────────── */}

      {/* SUBTAB: STOCK */}
      {activeSubTab === 'stock' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Sede / Bodega</th>
                  <th className="px-4 py-3 text-right">Físico</th>
                  <th className="px-4 py-3 text-right">Reservado</th>
                  <th className="px-4 py-3 text-right">Disponible</th>
                  <th className="px-4 py-3 text-right">Costo Promedio</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item.reserved}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{item.available}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">${item.averageCost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'OK' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 size={12} /> Normal
                        </span>
                      )}
                      {item.status === 'LOW_STOCK' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                          <AlertTriangle size={12} /> Bajo
                        </span>
                      )}
                      {item.status === 'CRITICAL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500">
                          <AlertTriangle size={12} /> Crítico
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: KARDEX */}
      {activeSubTab === 'kardex' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Fecha & Hora</th>
                  <th className="px-4 py-3">Producto / SKU</th>
                  <th className="px-4 py-3">Tipo Movimiento</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo Unitario</th>
                  <th className="px-4 py-3 text-right">Total Transacción</th>
                  <th className="px-4 py-3 text-right">Saldo Final</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3 text-center">Firma SHA-256 (FDA Part 11)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kardexEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{entry.productName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{entry.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      {entry.type === 'IN_PURCHASE' && (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-medium text-xs">
                          <ArrowDownRight size={14} /> Entrada Compra
                        </span>
                      )}
                      {entry.type === 'OUT_SALE' && (
                        <span className="inline-flex items-center gap-1 text-blue-500 font-medium text-xs">
                          <ArrowUpRight size={14} /> Salida Venta POS
                        </span>
                      )}
                      {entry.type === 'TRANSFER_OUT' && (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-medium text-xs">
                          <ArrowRightLeft size={14} /> Traslado Saliente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{entry.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">${entry.unitCost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold">${entry.totalCost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{entry.balanceAfter}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.reference}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono font-medium">{entry.operatorBadgeId || 'SISTEMA'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" title={entry.signatureHash}>
                        <ShieldCheck size={11} /> {entry.signatureHash ? entry.signatureHash.substring(0, 10) + '...' : 'SIN SELLO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: LOTS & FEFO */}
      {activeSubTab === 'lots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                Control de Lotes y Vencimientos (FEFO - First Expired, First Out)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prioriza automáticamente la venta y traslado de los lotes más próximos a expirar para mitigar mermas.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
              Protocolo FEFO Activo
            </span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Lote / SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3 text-right">Existencia</th>
                  <th className="px-4 py-3">Fecha Vencimiento</th>
                  <th className="px-4 py-3 text-center">Días Restantes</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Trazabilidad Inversa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lotItems.map(lot => (
                  <tr key={lot.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-bold text-foreground">{lot.lotNumber}</div>
                      <div className="text-xs text-muted-foreground font-mono">{lot.sku}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{lot.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{lot.warehouseName}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{lot.quantity}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{lot.expiryDate}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs font-semibold">
                      {lot.daysRemaining} días
                    </td>
                    <td className="px-4 py-3 text-center">
                      {lot.status === 'FRESH' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 size={12} /> Vigente
                        </span>
                      )}
                      {lot.status === 'WARNING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                          <AlertTriangle size={12} /> Por Vencer
                        </span>
                      )}
                      {lot.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500">
                          <AlertTriangle size={12} /> Vencido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedRecallLot(lot);
                          setIsRecallModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg transition"
                      >
                        <ShieldCheck size={12} /> Recall Blast-Radius
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: TRANSFERS */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">No. Remisión</th>
                  <th className="px-4 py-3">Sede Origen</th>
                  <th className="px-4 py-3">Sede Destino</th>
                  <th className="px-4 py-3">Resumen de Mercancía</th>
                  <th className="px-4 py-3">Fecha Despacho</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{tr.transferNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tr.origin}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{tr.destination}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tr.itemsSummary}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tr.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={12} /> {tr.status === 'RECEIVED' ? 'Recibido en Sede' : 'En Tránsito'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: LOCATIONS */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Gestión Espacial de Bodega (Bin & Rack Location)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Asigna coordenadas exactas (Zona, Pasillo, Rack, Nivel) para optimizar rutas de almacenamiento.</p>
            </div>
            <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition">
              <Plus className="w-4 h-4" /> Nueva Ubicación
            </button>
          </div>

          {/* RF Scanner Hardware Wedge Status Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-card border border-border rounded-xl text-xs gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold flex items-center gap-1.5">
                <SlidersHorizontal size={14} /> RF Scanner Wedge Activo
              </span>
              <span className="text-muted-foreground">
                Escucha continua de terminales Zebra / Honeywell (Intercepción sin foco de input).
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-muted-foreground">Último Escaneo:</span>
              <span className="px-2 py-0.5 rounded bg-muted font-bold text-foreground">
                {lastScannedBarcode || 'Z1-PA-R2-N3 (BIN)'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                1200Hz BEEP OK
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chaoticBins.map((bin) => (
              <div key={bin.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-500">{bin.binCode}</span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">{bin.zone}</h4>
                    <span className="text-xs text-muted-foreground">{bin.aisle} • {bin.rack} • Nivel {bin.shelfLevel}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bin.utilizationPct > 80 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {bin.utilizationPct}% Volumen
                  </span>
                </div>

                {/* Volumetric Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Ocupación Cúbica:</span>
                    <span className="font-mono font-bold text-foreground">
                      {(bin.currentVolumeCm3 / 1000).toFixed(0)}L / {(bin.maxVolumeCm3 / 1000).toFixed(0)}L (cm³)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        bin.utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${bin.utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Weight Rating */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Carga Estructural:</span>
                  <span className="font-mono font-bold text-foreground">
                    {bin.currentWeightKg}kg / {bin.maxWeightKg}kg máx
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border mt-4 bg-card shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">SKU / Producto</th>
                  <th className="px-4 py-3">Coordenada Bin</th>
                  <th className="px-4 py-3">Tipo Almacenaje</th>
                  <th className="px-4 py-3 text-right">Stock Físico en Posición</th>
                  <th className="px-4 py-3 text-center">Algoritmo de Guardado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-medium">Café Especial Geisha 500g <span className="text-xs text-muted-foreground ml-1 font-mono">ALM-001</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-500">Z1-PA-R2-N3</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">Seco (Ambiente)</span></td>
                  <td className="px-4 py-3 text-right font-bold">450 un</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400">
                      Chaotic Dynamic Binning
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-medium">Té Matcha Japonés <span className="text-xs text-muted-foreground ml-1 font-mono">BEV-010</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-500">Z1-PA-R1-N1</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">Seco (Ambiente)</span></td>
                  <td className="px-4 py-3 text-right font-bold">85 un</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400">
                      Chaotic Dynamic Binning
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-medium">Miel Orgánica de Bosque <span className="text-xs text-muted-foreground ml-1 font-mono">ALM-002</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-500">Z2-PB-R5-N2</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">Refrigerado (15°C)</span></td>
                  <td className="px-4 py-3 text-right font-bold text-amber-500">18 un</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400">
                      Chaotic Dynamic Binning
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: FULFILLMENT */}
      {activeSubTab === 'fulfillment' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-500" />
                Listas de Recolección (Wave & Batch Picking)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Órdenes de preparación consolidadas para agilizar el despacho hacia transporte o punto de venta.</p>
            </div>
            <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition">
              <Printer className="w-4 h-4" /> Imprimir Wave
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-amber-500 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground">WAVE-202609-01 (Prioridad B2B)</h3>
                  <span className="text-xs text-muted-foreground">3 Pedidos Mayoristas Consolidados</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">EN RECOLECCIÓN</span>
              </div>
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" defaultChecked />
                  <span className="text-muted-foreground line-through text-xs">1. Z1-PA-R1-N1: 10x Té Matcha Japonés</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" />
                  <span className="font-medium text-xs">2. Z1-PA-R2-N3: 150x Café Geisha 500g</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" />
                  <span className="font-medium text-xs">3. Z2-PB-R5-N2: 12x Miel Orgánica Bosque</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Operario: Carlos S.</div>
                <button className="text-xs text-emerald-500 hover:text-emerald-400 font-bold">Completar Recolección</button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground">WAVE-202609-02 (Canal E-Commerce)</h3>
                  <span className="text-xs text-muted-foreground">15 Pedidos Retail Consolidados</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">PENDIENTE</span>
              </div>
              <div className="space-y-2 mt-4 text-sm">
                <div className="text-muted-foreground italic text-xs mb-2">Ruta de recolección en espera...</div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-xs">1. Z1-PA-R2-N3: 15x Café Geisha 500g</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-xs">2. Z3-PC-R1-N1: 15x Caja Envío E-Commerce Pequeña</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Operario: Sin Asignar</div>
                <button className="text-xs text-blue-500 hover:text-blue-400 font-bold">Asignar Operario</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SUPPLIERS (MIGRADO A MÓDULO DEDICADO) */}
      {activeSubTab === 'suppliers' && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">El Módulo de Proveedores ahora es Independiente</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              Para optimizar la operación y separar el control documental (SRM) del kárdex de bodegas, la gestión de proveedores ahora cuenta con su propio panel dedicado.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/suppliers')}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-950/20"
          >
            Abrir Gestión Maestra de Proveedores →
          </button>
        </div>
      )}

      {/* SUBTAB: BOM */}
      {activeSubTab === 'bom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ChefHat size={16} className="text-amber-500" />
                Estructura de Materiales & Recetas (BOM - Bill of Materials)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Descuento automático de sub-insumos y mermas por cada ensamble o producto vendido en el POS.
              </p>
            </div>
            <button
              onClick={() => alert("Módulo de alta de receta disponible en el backend.")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-sm"
            >
              <Plus size={14} /> Nueva Receta BOM
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bomRecipes.map(recipe => (
              <div key={recipe.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-amber-500 font-bold">{recipe.parentSku}</span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">{recipe.parentName}</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    {recipe.components.length} insumos
                  </span>
                </div>

                <div className="border-t border-border pt-2 space-y-2">
                  <span className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Insumos Requeridos:</span>
                  <div className="divide-y divide-border/60">
                    {recipe.components.map((c, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-medium text-foreground">{c.childName}</span>
                          <span className="text-muted-foreground font-mono ml-2">({c.childSku})</span>
                        </div>
                        <span className="font-bold text-amber-500 font-mono">
                          {c.quantityRequired} {c.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB: FORECAST */}
      {activeSubTab === 'forecast' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                Predicción de Demanda & Días de Cobertura (DOH) con IA
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Algoritmo predictivo de compras para prevenir quiebres de inventario o costos ocultos por sobreinventario.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Stock Actual</th>
                  <th className="px-4 py-3 text-right">Venta Diaria Promedio</th>
                  <th className="px-4 py-3 text-center">Días de Stock (DOH)</th>
                  <th className="px-4 py-3 text-right">Reorden Sugerido</th>
                  <th className="px-4 py-3 text-center">Nivel de Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {forecastItems.map((fc, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{fc.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{fc.productName}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{fc.currentStock}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {fc.averageDailySales} un/día
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-mono text-sm">
                      {fc.daysOnHand} días
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-amber-500">
                      {fc.suggestedReorder > 0 ? `+${fc.suggestedReorder} un` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {fc.riskLevel === 'OPTIMAL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 size={12} /> Óptimo
                        </span>
                      )}
                      {fc.riskLevel === 'LOW_STOCK' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                          <AlertTriangle size={12} /> Reabastecer Pronto
                        </span>
                      )}
                      {fc.riskLevel === 'CRITICAL' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500">
                          <AlertTriangle size={12} /> Quiebre Inminente
                        </span>
                      )}
                      {fc.riskLevel === 'OVERSTOCKED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          Sobreinventario
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: AUDIT */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-500" />
                Auditoría y Arqueo Cíclico (Conteo Físico a Ciegas)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Control de mermas y exactitud de inventario (IRA) sin sesgar al auditor con el stock del sistema.</p>
            </div>
            <button className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition">
              <Plus className="w-4 h-4" /> Iniciar Arqueo
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border mt-4 bg-card shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">ID Arqueo</th>
                  <th className="px-4 py-3">Zona Auditada</th>
                  <th className="px-4 py-3">Auditor</th>
                  <th className="px-4 py-3">SKUs Revisados</th>
                  <th className="px-4 py-3">Exactitud (Match)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-mono font-bold">AUDIT-084</td>
                  <td className="px-4 py-3">Bodega Central (Pasillo A)</td>
                  <td className="px-4 py-3">Juan D.</td>
                  <td className="px-4 py-3">45 SKUs</td>
                  <td className="px-4 py-3"><span className="text-emerald-500 font-bold">100%</span> (Sin mermas)</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">APROBADO</span>
                  </td>
                </tr>
                <tr className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-mono font-bold">AUDIT-085</td>
                  <td className="px-4 py-3">Bodega Central (Refrigerados)</td>
                  <td className="px-4 py-3">Diana M.</td>
                  <td className="px-4 py-3">12 SKUs</td>
                  <td className="px-4 py-3"><span className="text-rose-500 font-bold">91%</span> (Faltan 2 un. Miel)</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition">
                      CONCILIAR DIFERENCIA
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Movement Modal ──────────────────────────────────────────────────── */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Registrar Movimiento de Stock</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-xs text-muted-foreground">Asienta movimientos en el Kárdex en tiempo real con costeo promedio ponderado.</p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bodega / Sede</label>
                <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Producto</label>
                <input type="text" defaultValue="Café Especial Geisha 500g (ALM-001)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad</label>
                  <input type="number" defaultValue={25} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Costo Unitario ($)</label>
                  <input type="number" defaultValue={28500} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Cancelar</button>
              <button onClick={() => { alert('Movimiento asentado en Kárdex'); setIsMovementModalOpen(false); }} className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold">Asentar en Kárdex</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Modal ──────────────────────────────────────────────────── */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Crear Traslado Inter-Bodegas</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Origen</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                    <option value="wh-1">Bodega Central (Cali)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Destino</label>
                  <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
                    <option value="wh-2">Tienda Calle 93 (Bogotá)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Mercancía & Unidades</label>
                <input type="text" defaultValue="Café Geisha 500g (20 unidades)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Cancelar</button>
              <button onClick={() => { alert('Orden de traslado TRF-00191 despachada'); setIsTransferModalOpen(false); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">Despachar Traslado</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recall Blast-Radius Modal (Tier-1 SLA <2.0s Compliance) ─────────── */}
      {isRecallModalOpen && selectedRecallLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-rose-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Análisis de Blast-Radius & Retiro de Lote (Recall)
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      SLA &lt;2.0s (14ms OK)
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Trazabilidad bi-direccional instantánea: Proveedor &rarr; Bins Internos &rarr; Órdenes Despachadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecallModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Lote Auditado</span>
                <span className="font-mono font-bold text-foreground text-sm">{selectedRecallLot.lotNumber}</span>
                <span className="text-muted-foreground block text-[11px] truncate">{selectedRecallLot.productName}</span>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">En Bodega Activa</span>
                <span className="font-mono font-bold text-amber-500 text-sm">{selectedRecallLot.quantity} unidades</span>
                <span className="text-amber-500/80 block text-[11px] truncate">Requiere Cuarentena Inmediata</span>
              </div>
              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <span className="text-[10px] text-rose-500 uppercase font-bold block mb-1">Blast-Radius Despachado</span>
                <span className="font-mono font-bold text-rose-500 text-sm">2 Órdenes / Clientes</span>
                <span className="text-rose-500/80 block text-[11px]">Expuestas en tránsito</span>
              </div>
            </div>

            {/* Traceability Tree */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <GitBranch size={14} className="text-purple-400" /> Árbol de Dispersión Genealógica
              </span>
              <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50 text-muted-foreground text-[11px]">
                  <span>1. Recepción Dock (PO-99120)</span>
                  <span className="text-emerald-400">Ingreso: 2026-09-15 08:30</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50 text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Boxes size={12} className="text-blue-400" /> Bin Actual: Z1-PA-R2-N3 ({selectedRecallLot.quantity} un)
                  </span>
                  <span className="text-amber-400">Listo para bloqueo</span>
                </div>
                <div className="flex items-center justify-between text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <Truck size={12} /> Despacho Orden #ORD-9410 (Cliente: Café Gourmet SAS - 25 un)
                  </span>
                  <span className="font-bold">NOTIFICACIÓN URGENTE</span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                Sellado Cryptográfico Ledger ID: <code className="text-foreground">0x9f1a...c82</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecallModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-lg"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    alert(`Lote ${selectedRecallLot.lotNumber} puesto en CUARENTENA GxP y órdenes bloqueadas preventivamente.`);
                    setIsRecallModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Lock size={12} /> Ejecutar Cuarentena GxP Inmediata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
