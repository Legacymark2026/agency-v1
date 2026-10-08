'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Package,
  Truck,
  Globe2,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  X,
  Edit3,
  Trash2,
  ShieldCheck,
  FileCheck2,
  Send,
  Boxes,
  Barcode,
  ArrowRight,
  HelpCircle,
  Eye,
  Check,
  ChevronDown
} from 'lucide-react';
import { ALL_INCOTERMS, ALL_CURRENCIES } from '../suppliers/suppliers-client';

// ── Tipos del Módulo de Compras ─────────────────────────────────────────────

export interface PurchaseOrderItem {
  productId?: string | null;
  internalSku: string;
  supplierSku?: string;
  barcode?: string;
  name: string;
  quantity: number;
  purchaseUnit: string;
  conversionFactor: number;
  unitPrice: number;
  discountPct: number;
  taxRatePct: number;
  subtotal: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  companyId: string;
  warehouseId: string;
  warehouseName?: string;
  vendorId?: string | null;
  vendorName: string;
  vendorNit?: string | null;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  status: 'DRAFT' | 'ISSUED' | 'CONFIRMED' | 'IN_TRANSIT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  currency: string;
  exchangeRate: number;
  incoterm?: string | null;
  incotermPlace?: string | null;
  paymentTermsDays: number;
  deliveryDate?: string | null;
  shippingMethod?: string | null;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  shippingCost: number;
  otherCosts: number;
  total: number;
  items: PurchaseOrderItem[];
  itemsCount?: number;
  notes?: string | null;
  rejectionReason?: string | null;
  issuedAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PURCHASE_STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; desc: string; step: number }
> = {
  DRAFT: {
    label: 'Borrador',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    desc: 'Orden en preparación, no enviada al proveedor.',
    step: 1,
  },
  ISSUED: {
    label: 'Emitida / Enviada',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    desc: 'Transmitida al proveedor, en espera de acuse.',
    step: 2,
  },
  CONFIRMED: {
    label: 'Confirmada por Proveedor',
    badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    desc: 'Proveedor aceptó precios, cantidades y plazos.',
    step: 3,
  },
  IN_TRANSIT: {
    label: 'En Tránsito / Despachada',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    desc: 'Guía de transporte activa hacia nuestra bodega.',
    step: 4,
  },
  PARTIALLY_RECEIVED: {
    label: 'Recibida Parcial',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    desc: 'Mercancía ingresada parcialmente en recepción.',
    step: 5,
  },
  RECEIVED: {
    label: 'Completada / Recibida',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    desc: '100% de los ítems ingresados al kárdex de inventario.',
    step: 6,
  },
  CANCELLED: {
    label: 'Cancelada',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    desc: 'Anulada por discrepancia o ruptura de stock.',
    step: 0,
  },
};

export function PurchasesClient() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([
    { id: 'wh-main', name: 'Bodega Central (Cali)', code: 'BOG-CALI' },
    { id: 'wh-bogota', name: 'Centro de Distribución Bogotá', code: 'CD-BOG' },
    { id: 'wh-medellin', name: 'Almacén Medellín', code: 'ALM-MED' },
  ]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  // Vista activa: Listado vs Detalle
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');

  // Form State para Creación / Edición
  const [formData, setFormData] = useState({
    id: '',
    vendorId: '',
    vendorName: '',
    vendorNit: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    warehouseId: 'wh-main',
    currency: 'COP',
    exchangeRate: 1.0,
    incoterm: 'DAP',
    incotermPlace: '',
    paymentTermsDays: 30,
    deliveryDate: '',
    shippingMethod: 'TERRESTRE',
    shippingCost: 0,
    otherCosts: 0,
    notes: '',
    items: [] as PurchaseOrderItem[],
  });

  // Selector de productos del proveedor para agregar a la orden
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [itemQtyToAdd, setItemQtyToAdd] = useState(1);
  const [itemPriceToAdd, setItemPriceToAdd] = useState(0);
  const [itemDiscToAdd, setItemDiscToAdd] = useState(0);
  const [itemTaxToAdd, setItemTaxToAdd] = useState(19);

  // Cargar órdenes y proveedores
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(data.orders[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, []);

  // Al seleccionar proveedor en el formulario, cargar su catálogo
  useEffect(() => {
    if (formData.vendorId) {
      const sup = suppliers.find((s) => s.id === formData.vendorId);
      if (sup) {
        setFormData((prev) => ({
          ...prev,
          vendorName: sup.name,
          vendorNit: sup.taxId || '',
          vendorEmail: sup.contactEmail || '',
          vendorPhone: sup.contactPhone || '',
          vendorAddress: sup.address || '',
          currency: sup.currency || 'COP',
          paymentTermsDays: sup.paymentTermsDays || 30,
          incoterm: sup.customFields?.deliveryTerms?.incoterm || 'DAP',
        }));
        if (Array.isArray(sup.products)) {
          setAvailableProducts(sup.products);
          if (sup.products.length > 0) {
            setSelectedProductToAdd(sup.products[0].id);
            setItemPriceToAdd(sup.products[0].purchasePrice || 0);
            setItemTaxToAdd(sup.products[0].taxRatePct ?? 19);
          }
        }
      }
    }
  }, [formData.vendorId, suppliers]);

  // Actualizar precio y tax cuando cambia el producto seleccionado para agregar
  const handleSelectProductChange = (productId: string) => {
    setSelectedProductToAdd(productId);
    const prod = availableProducts.find((p) => p.id === productId);
    if (prod) {
      setItemPriceToAdd(prod.purchasePrice || 0);
      setItemTaxToAdd(prod.taxRatePct ?? 19);
      setItemQtyToAdd(prod.minOrderQty || 1);
    }
  };

  // Agregar ítem al pedido
  const handleAddItemToOrder = () => {
    const prod = availableProducts.find((p) => p.id === selectedProductToAdd);
    if (!prod) return;

    const qty = Number(itemQtyToAdd) || 1;
    const unitPrice = Number(itemPriceToAdd) || 0;
    const discPct = Number(itemDiscToAdd) || 0;
    const taxPct = Number(itemTaxToAdd) || 0;

    const lineGross = qty * unitPrice;
    const lineDisc = lineGross * (discPct / 100);
    const lineNet = lineGross - lineDisc;
    const lineTax = lineNet * (taxPct / 100);
    const lineTotal = lineNet + lineTax;

    const newItem: PurchaseOrderItem = {
      productId: prod.id,
      internalSku: prod.internalSku,
      supplierSku: prod.supplierSku,
      barcode: prod.barcode || '',
      name: prod.name,
      quantity: qty,
      purchaseUnit: prod.purchaseUnit || 'UNIDAD',
      conversionFactor: prod.conversionFactor || 1,
      unitPrice,
      discountPct: discPct,
      taxRatePct: taxPct,
      subtotal: lineNet,
      total: lineTotal,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Cálculo de totales en formulario
  const computedFormTotals = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let tax = 0;

    formData.items.forEach((item) => {
      const gross = item.quantity * item.unitPrice;
      const d = gross * (item.discountPct / 100);
      const net = gross - d;
      const t = net * (item.taxRatePct / 100);
      sub += gross;
      disc += d;
      tax += t;
    });

    const shipping = Number(formData.shippingCost) || 0;
    const other = Number(formData.otherCosts) || 0;
    const grand = sub - disc + tax + shipping + other;

    return { subtotal: sub, discountTotal: disc, taxAmount: tax, total: grand };
  }, [formData.items, formData.shippingCost, formData.otherCosts]);

  // Abrir Modal de Creación
  const openCreateModal = () => {
    setModalMode('CREATE');
    setFormData({
      id: '',
      vendorId: suppliers[0]?.id || '',
      vendorName: suppliers[0]?.name || '',
      vendorNit: suppliers[0]?.taxId || '',
      vendorEmail: suppliers[0]?.contactEmail || '',
      vendorPhone: suppliers[0]?.contactPhone || '',
      vendorAddress: suppliers[0]?.address || '',
      warehouseId: warehouses[0]?.id || 'wh-main',
      currency: 'COP',
      exchangeRate: 1.0,
      incoterm: 'DAP',
      incotermPlace: '',
      paymentTermsDays: 30,
      deliveryDate: '',
      shippingMethod: 'TERRESTRE',
      shippingCost: 0,
      otherCosts: 0,
      notes: '',
      items: [],
    });
    setIsCreateModalOpen(true);
  };

  // Guardar Orden
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debes agregar al menos un artículo a la orden de compra.');
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = modalMode === 'CREATE' ? '/api/purchases' : `/api/purchases/${formData.id}`;
      const method = modalMode === 'CREATE' ? 'POST' : 'PATCH';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        await fetchPurchases();
        if (data.order) setSelectedOrder(data.order);
      } else {
        alert(data.error || 'Error al guardar orden');
      }
    } catch (err: any) {
      alert('Fallo en la conexión: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transición de ciclo de vida (Issue, Confirm, Cancel)
  const handleOrderAction = async (action: string, orderId: string) => {
    try {
      const res = await fetch(`/api/purchases/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPurchases();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Error en la acción');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Filtrado de órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.vendorNit && o.vendorNit.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchesVendor = vendorFilter === 'ALL' || o.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [orders, searchTerm, statusFilter, vendorFilter]);

  // Métricas Consolidadas del Módulo
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const activePipeline = orders.filter((o) => ['ISSUED', 'CONFIRMED', 'IN_TRANSIT'].includes(o.status));
    const totalCommittedValue = activePipeline.reduce((acc, curr) => acc + curr.total, 0);
    const completedOrders = orders.filter((o) => o.status === 'RECEIVED').length;
    const draftCount = orders.filter((o) => o.status === 'DRAFT').length;

    return { totalOrders, activePipelineCount: activePipeline.length, totalCommittedValue, completedOrders, draftCount };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* ── Cabecera Quantum Ultra-Profesional ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border border-border shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShoppingCart size={13} />
              <span>Gestión de Aprovisionamiento & Órdenes de Compra</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              Módulo de Compras & SRM
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Incoterms 2020 + Multidivisa
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Emisión de órdenes de compra, control presupuestal, sincronización con el catálogo técnico de proveedores
              y trazabilidad hasta la recepción en bodega.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchPurchases}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 hover:bg-card text-foreground text-xs font-semibold shadow-sm transition"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition transform active:scale-95"
            >
              <Plus size={16} />
              NUEVA ORDEN DE COMPRA
            </button>
          </div>
        </div>

        {/* ── KPIs de Compras ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/60">
          <div className="p-4 rounded-xl bg-card/40 border border-border/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Órdenes Activas</span>
              <ShoppingCart size={16} className="text-indigo-400" />
            </div>
            <div className="text-2xl font-black mt-1 text-foreground">
              {metrics.activePipelineCount}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">en tránsito</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.draftCount} en borrador pendiente
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/40 border border-border/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Compromiso Financiero</span>
              <DollarSign size={16} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black mt-1 text-foreground">
              ${metrics.totalCommittedValue.toLocaleString('es-CO')}
              <span className="text-xs font-normal text-muted-foreground ml-1">COP</span>
            </div>
            <div className="text-[11px] text-teal-400 mt-0.5 flex items-center gap-1">
              <TrendingUp size={12} /> Órdenes emitidas no recibidas
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/40 border border-border/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Histórico Recibido</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black mt-1 text-foreground">
              {metrics.completedOrders}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">completadas</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Entradas a inventario kárdex</div>
          </div>

          <div className="p-4 rounded-xl bg-card/40 border border-border/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Red de Proveedores</span>
              <Building2 size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black mt-1 text-foreground">
              {suppliers.length}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">homologados</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Catálogo técnico unificado</div>
          </div>
        </div>
      </div>

      {/* ── Barra de Búsqueda y Filtros ─────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número de orden (OC-2026-...), nombre o NIT de proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Estado */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              {Object.entries(PURCHASE_STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Proveedor */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Proveedor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none max-w-[200px]"
            >
              <option value="ALL">Todos los Proveedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Contenido Principal: Grilla Split (Directorio Izquierdo + Dossier Derecho) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Listado de Órdenes (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Órdenes de Compra ({filteredOrders.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-teal-400" />
              <p className="text-xs">Cargando compras...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
              <ShoppingCart size={32} className="mx-auto text-muted-foreground/60" />
              <p className="text-xs font-medium">No se encontraron órdenes de compra.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
              >
                Crear Primera Orden
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[800px] overflow-y-auto pr-1">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const statusCfg = PURCHASE_STATUS_CONFIG[order.status] || PURCHASE_STATUS_CONFIG.DRAFT;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                        : 'bg-card/70 hover:bg-card border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-foreground">{order.orderNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground mt-1 truncate max-w-[220px]">
                          {order.vendorName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> NIT: {order.vendorNit || 'Sin registrar'}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-foreground">
                          ${order.total.toLocaleString('es-CO')}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">{order.currency}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Boxes size={12} className="text-teal-400" />
                        <span>{order.itemsCount || (order.items ? order.items.length : 0)} ítems</span>
                        {order.incoterm && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                            {order.incoterm}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-CO')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Dossier Detallado de la Orden (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-6">
              {/* Cabecera del Dossier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-foreground">{selectedOrder.orderNumber}</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        PURCHASE_STATUS_CONFIG[selectedOrder.status]?.badge
                      }`}
                    >
                      {PURCHASE_STATUS_CONFIG[selectedOrder.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Emitida el {new Date(selectedOrder.createdAt).toLocaleDateString('es-CO')} • Actualizada hace poco
                  </p>
                </div>

                {/* Acciones de Ciclo de Vida */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status === 'DRAFT' && (
                    <button
                      onClick={() => handleOrderAction('ISSUE', selectedOrder.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Send size={13} />
                      EMITIR A PROVEEDOR
                    </button>
                  )}

                  {selectedOrder.status === 'ISSUED' && (
                    <button
                      onClick={() => handleOrderAction('CONFIRM', selectedOrder.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      <CheckCircle2 size={13} />
                      CONFIRMAR ACUERDO
                    </button>
                  )}

                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleOrderAction('IN_TRANSIT', selectedOrder.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Truck size={13} />
                      MARCAR EN TRÁNSITO
                    </button>
                  )}

                  {['DRAFT', 'ISSUED'].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleOrderAction('CANCEL', selectedOrder.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold transition"
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Fila de Proveedor & Logística */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={13} className="text-teal-400" /> Datos del Proveedor
                  </span>
                  <div className="text-sm font-bold text-foreground">{selectedOrder.vendorName}</div>
                  <div className="text-xs text-muted-foreground">NIT: {selectedOrder.vendorNit || 'N/A'}</div>
                  {selectedOrder.vendorEmail && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail size={12} /> {selectedOrder.vendorEmail}
                    </div>
                  )}
                  {selectedOrder.vendorPhone && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone size={12} /> {selectedOrder.vendorPhone}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Truck size={13} className="text-indigo-400" /> Condiciones Comerciales & Logística
                  </span>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Incoterm 2020:</span>
                    <span className="font-bold text-foreground">
                      {selectedOrder.incoterm || 'No especificado'} {selectedOrder.incotermPlace ? `(${selectedOrder.incotermPlace})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Plazo de Pago:</span>
                    <span className="font-bold text-foreground">{selectedOrder.paymentTermsDays} días crédito</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Método de Envío:</span>
                    <span className="font-bold text-foreground">{selectedOrder.shippingMethod || 'Terrestre'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Destino de Entrega:</span>
                    <span className="font-bold text-foreground">{selectedOrder.warehouseName || 'Bodega Central'}</span>
                  </div>
                </div>
              </div>

              {/* Tabla de Artículos de la Orden */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-teal-400" />
                    Artículos Solicitados ({selectedOrder.items?.length || 0})
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">SKU / Descripción</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Precio Unit.</th>
                        <th className="p-3 text-center">Desc %</th>
                        <th className="p-3 text-center">IVA %</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-3">
                              <div className="font-bold text-foreground">{item.name}</div>
                              <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                                <span>SKU Int: {item.internalSku}</span>
                                {item.supplierSku && <span>• Ref Prov: {item.supplierSku}</span>}
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-foreground">
                              {item.quantity} {item.purchaseUnit}
                            </td>
                            <td className="p-3 text-right font-mono text-foreground">
                              ${item.unitPrice.toLocaleString('es-CO')}
                            </td>
                            <td className="p-3 text-center text-muted-foreground">
                              {item.discountPct ? `${item.discountPct}%` : '0%'}
                            </td>
                            <td className="p-3 text-center text-muted-foreground">{item.taxRatePct}%</td>
                            <td className="p-3 text-right font-bold text-foreground font-mono">
                              ${item.total.toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            Sin artículos registrados en esta orden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Liquidación Económica */}
              <div className="p-4 rounded-xl bg-slate-900 border border-border/80 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-1.5 max-w-sm">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Notas / Instrucciones</span>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.notes || 'Sin observaciones adicionales para el proveedor.'}
                  </p>
                </div>

                <div className="w-full md:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Bruto:</span>
                    <span className="font-mono">${selectedOrder.subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {selectedOrder.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuentos:</span>
                      <span className="font-mono">-${selectedOrder.discountTotal.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Impuestos (IVA):</span>
                    <span className="font-mono">${selectedOrder.taxAmount.toLocaleString('es-CO')}</span>
                  </div>
                  {selectedOrder.shippingCost > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Flete / Logística:</span>
                      <span className="font-mono">${selectedOrder.shippingCost.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border">
                    <span>TOTAL GENERAL:</span>
                    <span className="font-mono text-teal-400">
                      ${selectedOrder.total.toLocaleString('es-CO')} {selectedOrder.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
              <div>
                <ShoppingCart size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-bold">Selecciona una orden de compra</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Elige una orden de la lista para ver su dossier comercial, ítems y opciones de emisión.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de Emisión de Orden de Compra ──────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-border rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Emitir Nueva Orden de Compra</h2>
                  <p className="text-xs text-muted-foreground">
                    Selecciona el proveedor y los artículos vinculados para generar el documento formal.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-6">
              {/* Sección 1: Selección de Proveedor y Almacén */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Proveedor Homologado *
                  </label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    <option value="">Seleccione proveedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.taxId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Bodega de Destino *
                  </label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Divisa de Negociación *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {ALL_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 2: Términos Comerciales & Incoterms */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Incoterm 2020</label>
                  <select
                    value={formData.incoterm}
                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  >
                    {ALL_INCOTERMS.map((inc) => (
                      <option key={inc.code} value={inc.code}>
                        {inc.code} - {inc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Lugar Convenido Incoterm
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Puerto Buenaventura / Bodega Cali"
                    value={formData.incotermPlace}
                    onChange={(e) => setFormData({ ...formData, incotermPlace: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Plazo de Pago (Días)
                  </label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Método de Envío</label>
                  <select
                    value={formData.shippingMethod}
                    onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  >
                    <option value="TERRESTRE">Terrestre</option>
                    <option value="AEREO">Aéreo</option>
                    <option value="MARITIMO">Marítimo</option>
                    <option value="MULTIMODAL">Multimodal</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Constructor de Artículos desde Catálogo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Boxes size={14} className="text-teal-400" />
                    Artículos a Ordenar ({formData.items.length})
                  </h3>
                </div>

                {/* Sub-formulario para agregar artículo */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-muted/30 border border-border items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Artículo del Catálogo
                    </label>
                    <select
                      value={selectedProductToAdd}
                      onChange={(e) => handleSelectProductChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none"
                    >
                      {availableProducts.length === 0 ? (
                        <option value="">Seleccione proveedor para cargar catálogo</option>
                      ) : (
                        availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.internalSku}] {p.name} - ${p.purchasePrice}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQtyToAdd}
                      onChange={(e) => setItemQtyToAdd(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      value={itemPriceToAdd}
                      onChange={(e) => setItemPriceToAdd(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Desc %</label>
                    <input
                      type="number"
                      value={itemDiscToAdd}
                      onChange={(e) => setItemDiscToAdd(Number(e.target.value))}
                      className="w-full text-xs px-2 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none font-mono text-center"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToOrder}
                      disabled={!selectedProductToAdd}
                      className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                </div>

                {/* Tabla de Artículos Agregados en el Modal */}
                <div className="overflow-x-auto rounded-xl border border-border max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border sticky top-0">
                      <tr>
                        <th className="p-2.5">Producto</th>
                        <th className="p-2.5 text-center">Cant.</th>
                        <th className="p-2.5 text-right">Unitario</th>
                        <th className="p-2.5 text-center">Desc %</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {formData.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-2.5">
                            <span className="font-bold text-foreground">{it.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              SKU: {it.internalSku}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono">${it.unitPrice.toLocaleString('es-CO')}</td>
                          <td className="p-2.5 text-center text-muted-foreground">{it.discountPct}%</td>
                          <td className="p-2.5 text-right font-bold font-mono">
                            ${it.total.toLocaleString('es-CO')}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formData.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            Aún no has agregado artículos a esta orden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 4: Observaciones y Liquidación Final */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Observaciones / Instrucciones de Entrega
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Instrucciones para despacho, requisitos de empaque o referencias de cotización..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  />
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">${computedFormTotals.subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuentos:</span>
                    <span className="font-mono">-${computedFormTotals.discountTotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IVA Estimado:</span>
                    <span className="font-mono">${computedFormTotals.taxAmount.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border">
                    <span>TOTAL ESTIMADO:</span>
                    <span className="font-mono text-teal-400">
                      ${computedFormTotals.total.toLocaleString('es-CO')} {formData.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.items.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'GUARDAR ORDEN EN BORRADOR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
