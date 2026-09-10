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
  Truck
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

export function InventoryClient() {
  const [activeTab, setActiveTab] = useState<'stock' | 'kardex' | 'transfers'>('stock');
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
            Control multisede de existencias, Kárdex con costeo promedio ponderado (PEPS), compras y traslados.
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
            $${totalValue.toLocaleString('es-CO')} <span className="text-xs font-normal text-muted-foreground">COP</span>
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
      <div className="border-b border-border flex items-center gap-6">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'stock'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={16} />
          Existencias por Bodega
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'kardex'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History size={16} />
          Kárdex Contable (PEPS)
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'transfers'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck size={16} />
          Traslados de Mercancía ({transfers.length})
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
