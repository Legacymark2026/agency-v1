'use client';

import { useState } from 'react';
import {
  Boxes,
  Warehouse,
  ArrowRightLeft,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  FileText,
  DollarSign,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  Calendar,
  Sparkles,
  ChefHat,
  Tag,
  MapPin,
  ListChecks,
  ClipboardCheck,
  Printer
} from 'lucide-react';

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
  riskLevel: 'CRITICAL' | 'LOW_STOCK' | 'OPTIMAL' | 'OVERSTOCKED';
}

export function InventoryClient() {
  const [activeTab, setActiveTab] = useState<'stock' | 'kardex' | 'transfers' | 'lots' | 'bom' | 'forecast' | 'locations' | 'fulfillment' | 'audit'>('stock');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const warehouses: WarehouseData[] = [
    { id: 'wh-1', name: 'Bodega Central Fontibón', code: 'BOD-CENTRAL', city: 'Bogotá D.C.', isMain: true, totalSkus: 142 },
    { id: 'wh-2', name: 'Tienda Física Calle 93', code: 'TIENDA-01', city: 'Bogotá D.C.', isMain: false, totalSkus: 88 },
    { id: 'wh-3', name: 'Centro Logístico Medellín', code: 'BOD-MED', city: 'Medellín', isMain: false, totalSkus: 95 },
  ];

  const [stockItems] = useState<StockItem[]>([
    { id: 's-1', sku: 'ALM-001', name: 'Café Especial Geisha 500g', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 450, reserved: 20, available: 430, averageCost: 28500, reorderPoint: 50, status: 'OK' },
    { id: 's-2', sku: 'ALM-002', name: 'Miel Orgánica de Bosque 300ml', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 18, reserved: 5, available: 13, averageCost: 14200, reorderPoint: 30, status: 'LOW_STOCK' },
    { id: 's-3', sku: 'ALM-001', name: 'Café Especial Geisha 500g', warehouseId: 'wh-2', warehouseName: 'Tienda Calle 93', quantity: 12, reserved: 0, available: 12, averageCost: 28500, reorderPoint: 15, status: 'LOW_STOCK' },
    { id: 's-4', sku: 'BEV-010', name: 'Té Matcha Japonés Ceremonial', warehouseId: 'wh-1', warehouseName: 'Bodega Central', quantity: 85, reserved: 10, available: 75, averageCost: 45000, reorderPoint: 20, status: 'OK' },
    { id: 's-5', sku: 'ACC-099', name: 'Prensa Francesa Vidrio Borosilicato', warehouseId: 'wh-3', warehouseName: 'Logística Medellín', quantity: 4, reserved: 0, available: 4, averageCost: 62000, reorderPoint: 10, status: 'CRITICAL' },
  ]);

  const [kardexEntries] = useState<KardexEntry[]>([
    { id: 'k-1', date: '2026-09-10 09:30', productName: 'Café Especial Geisha 500g', sku: 'ALM-001', type: 'OUT_SALE', quantity: 2, unitCost: 28500, totalCost: 57000, balanceAfter: 450, reference: 'POS-REC-1049' },
    { id: 'k-2', date: '2026-09-09 16:15', productName: 'Café Especial Geisha 500g', sku: 'ALM-001', type: 'TRANSFER_OUT', quantity: 20, unitCost: 28500, totalCost: 570000, balanceAfter: 452, reference: 'TRF-00189' },
    { id: 'k-3', date: '2026-09-08 11:20', productName: 'Miel Orgánica de Bosque', sku: 'ALM-002', type: 'IN_PURCHASE', quantity: 50, unitCost: 14200, totalCost: 710000, balanceAfter: 18, reference: 'FAC-PROV-993' },
    { id: 'k-4', date: '2026-09-07 14:00', productName: 'Prensa Francesa', sku: 'ACC-099', type: 'OUT_SALE', quantity: 6, unitCost: 62000, totalCost: 372000, balanceAfter: 4, reference: 'POS-REC-1011' },
  ]);

  const [transfers] = useState<TransferOrder[]>([
    { id: 'tr-1', transferNumber: 'TRF-00189', origin: 'Bodega Central Fontibón', destination: 'Tienda Física Calle 93', itemsSummary: '20x Café Geisha, 10x Té Matcha', date: '2026-09-09', status: 'RECEIVED' },
    { id: 'tr-2', transferNumber: 'TRF-00190', origin: 'Bodega Central Fontibón', destination: 'Centro Logístico Medellín', itemsSummary: '50x Miel Orgánica', date: '2026-09-10', status: 'DISPATCHED' },
  ]);

  const [lotItems] = useState<ProductLotUI[]>([
    { id: 'lot-1', sku: 'ALM-001', lotNumber: 'LOTE-2026-04A', productName: 'Café Especial Geisha 500g', warehouseName: 'Bodega Central', quantity: 180, expiryDate: '2026-10-15', daysRemaining: 29, status: 'WARNING' },
    { id: 'lot-2', sku: 'ALM-001', lotNumber: 'LOTE-2026-05B', productName: 'Café Especial Geisha 500g', warehouseName: 'Bodega Central', quantity: 270, expiryDate: '2026-12-20', daysRemaining: 95, status: 'FRESH' },
    { id: 'lot-3', sku: 'ALM-002', lotNumber: 'MIEL-26-01', productName: 'Miel Orgánica de Bosque', warehouseName: 'Bodega Central', quantity: 18, expiryDate: '2027-03-30', daysRemaining: 195, status: 'FRESH' },
    { id: 'lot-4', sku: 'BEV-010', lotNumber: 'MATCHA-2026-X', productName: 'Té Matcha Japonés', warehouseName: 'Bodega Central', quantity: 85, expiryDate: '2026-11-01', daysRemaining: 46, status: 'FRESH' },
  ]);

  const [bomRecipes] = useState<BomRecipeUI[]>([
    {
      id: 'bom-1',
      parentSku: 'BEV-LATTE-8OZ',
      parentName: 'Café Latte Caliente (8oz)',
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

  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.averageCost), 0);
  const lowStockCount = stockItems.filter(i => i.status !== 'OK').length;

  const filteredItems = stockItems.filter(item => {
    const matchesWarehouse = selectedWarehouse === 'ALL' || item.warehouseId === selectedWarehouse;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Boxes size={24} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Inventario & Bodegas</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Control multisede de existencias, Kárdex con costeo promedio ponderado, Lotes FEFO, Recetas (BOM) y Forecasting con IA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition"
          >
            <ArrowRightLeft size={16} />
            Traslado Inter-Bodegas
          </button>
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow transition"
          >
            <Plus size={16} />
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Valor Total Inventario</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">
            ${totalValue.toLocaleString('es-CO')} <span className="text-xs font-normal text-muted-foreground">COP</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-500" /> Costeo promedio ponderado
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Bodegas Activas</span>
            <Warehouse size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{warehouses.length}</div>
          <div className="text-xs text-muted-foreground mt-1">1 Principal, 2 Sucursales</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Total SKUs Activos</span>
            <Package size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{stockItems.length}</div>
          <div className="text-xs text-muted-foreground mt-1">En todas las sedes</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Alertas de Reorden</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-500">{lowStockCount} SKUs</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingDown size={12} className="text-amber-500" /> Stock bajo o crítico
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'stock'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={16} />
          Existencias
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'kardex'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History size={16} />
          Kárdex
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'transfers'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck size={16} />
          Traslados ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab('lots')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'lots'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={16} />
          Lotes & Vencimientos (FEFO)
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'bom'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChefHat size={16} />
          Recetas & Ensambles (BOM)
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'forecast'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={16} className="text-amber-400" />
          Demanda & Reabastecimiento IA
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'locations'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin size={16} className="text-blue-400" />
          Mapa de Ubicaciones Físicas
        </button>
        <button
          onClick={() => setActiveTab('fulfillment')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'fulfillment'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ListChecks size={16} className="text-emerald-400" />
          Pick, Pack & Ship (Fulfillment)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardCheck size={16} className="text-purple-400" />
          Auditoría y Arqueo Cíclico
        </button>
      </div>

      {/* Tab: Stock */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por SKU o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter size={14} /> Bodega:
              </span>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="text-sm bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">Todas las Bodegas</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Bodega</th>
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
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item.reserved}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{item.available}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">$${item.averageCost.toLocaleString('es-CO')}</td>
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

      {/* Tab: Kardex */}
      {activeTab === 'kardex' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Producto / SKU</th>
                  <th className="px-4 py-3">Tipo Movimiento</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo Unitario</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Saldo Final</th>
                  <th className="px-4 py-3">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {kardexEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.date}</td>
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
                    <td className="px-4 py-3 text-right font-mono text-xs">$${entry.unitCost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold">$${entry.totalCost.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{entry.balanceAfter}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{entry.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transfers */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">No. Remisión</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Resumen de Mercancía</th>
                  <th className="px-4 py-3">Fecha</th>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 size={12} /> {tr.status === 'RECEIVED' ? 'Recibido' : 'Despachado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Lots & FEFO */}
      {activeTab === 'lots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-amber-500" />
                Control de Lotes y Vencimientos (Estrategia FEFO)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Despacho inteligente priorizando el lote con fecha de expiración más próxima (*First-Expired, First-Out*).
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-md">
              FEFO Activo
            </span>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Lote / SKU</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Bodega</th>
                  <th className="px-4 py-3 text-right">Existencia</th>
                  <th className="px-4 py-3">Fecha Vencimiento</th>
                  <th className="px-4 py-3 text-center">Días Restantes</th>
                  <th className="px-4 py-3 text-center">Estado</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: BOM (Bill of Materials) */}
      {activeTab === 'bom' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ChefHat size={18} className="text-amber-500" />
                Estructura de Materiales & Recetas (BOM)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Descuento automático de ingredientes, materias primas y empaques tras cada venta en el POS.
              </p>
            </div>
            <button
              onClick={() => alert("Módulo de alta de receta disponible en el backend.")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition shadow-sm"
            >
              <Plus size={14} /> Nueva Receta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bomRecipes.map(recipe => (
              <div key={recipe.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-amber-500 font-semibold">{recipe.parentSku}</span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">{recipe.parentName}</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {recipe.components.length} insumos
                  </span>
                </div>

                <div className="border-t border-border pt-2 space-y-2">
                  <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Insumos y Mermas:</span>
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

      {/* Tab: Demand Forecasting (IA) */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Predicción de Demanda & DOH (*Days on Hand*) con IA
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cálculo predictivo de días de stock restantes según consumo diario y órdenes de reabastecimiento sugeridas.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden bg-card">
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

      {/* Tab: Locations */}
      {activeTab === 'locations' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Gestión Espacial (Bin & Location)
            </h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nueva Ubicación
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Mapeo físico de la Bodega Central. Asigna coordenadas (Zona, Pasillo, Rack, Nivel) a los SKUs.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Racks Summary */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-3">Pasillo A - Racks Secos</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                  <span className="font-mono">RACK-A1</span>
                  <span className="text-emerald-500 font-bold">85% Ocupado</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                  <span className="font-mono">RACK-A2</span>
                  <span className="text-emerald-500 font-bold">60% Ocupado</span>
                </div>
                <div className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                  <span className="font-mono">RACK-A3</span>
                  <span className="text-amber-500 font-bold">95% Ocupado</span>
                </div>
              </div>
            </div>
            {/* Visual Heatmap representation (Mocked) */}
            <div className="md:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col justify-center items-center h-48 border-dashed">
              <MapPin className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <span className="text-sm font-medium text-muted-foreground">Mapa Visual de Bodega (Drag & Drop de SKUs) en Desarrollo</span>
              <span className="text-xs text-muted-foreground/70 mt-1">Soporte para Códigos de Barras en Posiciones</span>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-border mt-4">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">SKU / Producto</th>
                  <th className="px-4 py-3 font-semibold">Coordenada (Bin Location)</th>
                  <th className="px-4 py-3 font-semibold">Tipo Almacenaje</th>
                  <th className="px-4 py-3 font-semibold">Stock Físico en Posición</th>
                </tr>
              </thead>
              <tbody className="bg-card text-card-foreground">
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium">Café Especial Geisha 500g <span className="text-xs text-muted-foreground ml-1">ALM-001</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">Z1-PA-R2-N3</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">Seco (Ambiente)</span></td>
                  <td className="px-4 py-3">450 un</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium">Té Matcha Japonés <span className="text-xs text-muted-foreground ml-1">BEV-010</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">Z1-PA-R1-N1</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">Seco (Ambiente)</span></td>
                  <td className="px-4 py-3">85 un</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Miel Orgánica de Bosque <span className="text-xs text-muted-foreground ml-1">ALM-002</span></td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-400">Z2-PB-R5-N2</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">Refrigerado (15°C)</span></td>
                  <td className="px-4 py-3 text-amber-500 font-bold">18 un</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Fulfillment */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-500" />
              Listas de Recolección (Wave Picking)
            </h2>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir Wave
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Órdenes de preparación optimizadas por la ruta más corta en la bodega.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground">WAVE-202609-01 (Urgente)</h3>
                  <span className="text-xs text-muted-foreground">3 Pedidos B2B Consolidados</span>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">EN PICKING</span>
              </div>
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" defaultChecked />
                  <span className="text-muted-foreground line-through">1. Z1-PA-R1-N1: 10x Té Matcha</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" />
                  <span className="font-medium">2. Z1-PA-R2-N3: 150x Café Geisha 500g</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-border bg-background" />
                  <span className="font-medium">3. Z2-PB-R5-N2: 12x Miel Orgánica</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Operario: Carlos S.</div>
                <button className="text-xs text-emerald-500 hover:text-emerald-400 font-bold">Completar Recolección</button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground">WAVE-202609-02 (E-Commerce)</h3>
                  <span className="text-xs text-muted-foreground">15 Pedidos Retail Consolidados</span>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">PENDIENTE</span>
              </div>
              <div className="space-y-2 mt-4 text-sm">
                <div className="text-muted-foreground italic text-xs mb-2">Ruta optimizada pendiente de inicio...</div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">1. Z1-PA-R2-N3: 15x Café Geisha 500g</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">2. Z3-PC-R1-N1: 15x Caja Envío E-Commerce Pequeña</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Operario: Sin Asignar</div>
                <button className="text-xs text-blue-500 hover:text-blue-400 font-bold">Asignar e Iniciar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-500" />
              Auditoría y Arqueo Cíclico (A Ciegas)
            </h2>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> Iniciar Conteo
            </button>
          </div>
          <p className="text-sm text-muted-foreground">Flujo de revisión de existencias para detección de mermas o descuadres sin revelar el saldo teórico del sistema al auditor.</p>

          <div className="overflow-x-auto rounded-xl border border-border mt-4">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID Arqueo</th>
                  <th className="px-4 py-3 font-semibold">Zona Auditada</th>
                  <th className="px-4 py-3 font-semibold">Auditor</th>
                  <th className="px-4 py-3 font-semibold">SKUs Revisados</th>
                  <th className="px-4 py-3 font-semibold">Precisión (Match)</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-card text-card-foreground">
                <tr className="border-b border-border/50">
                  <td className="px-4 py-3 font-mono font-bold">AUDIT-084</td>
                  <td className="px-4 py-3">Bodega Central (Pasillo A)</td>
                  <td className="px-4 py-3">Juan D.</td>
                  <td className="px-4 py-3">45 SKUs</td>
                  <td className="px-4 py-3"><span className="text-emerald-500 font-bold">100%</span> (Sin mermas)</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">APROBADO</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-bold">AUDIT-085</td>
                  <td className="px-4 py-3">Bodega Central (Refrigerados)</td>
                  <td className="px-4 py-3">Diana M.</td>
                  <td className="px-4 py-3">12 SKUs</td>
                  <td className="px-4 py-3"><span className="text-rose-500 font-bold">91%</span> (Faltan 2 un. Miel)</td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold">CONCILIAR DIFERENCIA</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Registrar Movimiento de Stock</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <p className="text-xs text-muted-foreground">Actualiza instantáneamente el Kárdex contable y las existencias por sede.</p>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bodega</label>
                <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Producto</label>
                <input type="text" defaultValue="Café Especial Geisha 500g (ALM-001)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cantidad</label>
                  <input type="number" defaultValue={25} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Costo Unitario ($)</label>
                  <input type="number" defaultValue={28500} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md">Cancelar</button>
              <button onClick={() => { alert('Movimiento asentado en Kárdex'); setIsMovementModalOpen(false); }} className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium">Asentar en Kárdex</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Crear Traslado Inter-Bodegas</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Origen</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                    <option value="wh-1">Bodega Central</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Destino</label>
                  <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                    <option value="wh-2">Tienda Calle 93</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Producto / Cantidad</label>
                <input type="text" defaultValue="Café Geisha 500g (20 unidades)" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md">Cancelar</button>
              <button onClick={() => { alert('Orden de traslado TRF-00191 creada'); setIsTransferModalOpen(false); }} className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium">Despachar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
