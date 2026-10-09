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
  Eye,
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowUpRight,
  RotateCcw,
  BarChart3,
  SlidersHorizontal,
  ClipboardCheck,
  Award,
  Zap,
  Sparkles
} from 'lucide-react';
import { InteractiveSpotlight } from '@/components/dashboard/InteractiveSpotlight';
import { ALL_INCOTERMS, ALL_CURRENCIES } from '../suppliers/suppliers-client';

// ── Tipos y Configuraciones ──────────────────────────────────────────────────

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
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'ISSUED'
    | 'CONFIRMED'
    | 'IN_TRANSIT'
    | 'PARTIALLY_RECEIVED'
    | 'RECEIVED'
    | 'CANCELLED';
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
    desc: 'Orden en preparación, no enviada.',
    step: 1,
  },
  PENDING_APPROVAL: {
    label: 'Pendiente Aprobación',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    desc: 'Supera el umbral financiero. Requiere visto bueno de Gerencia.',
    step: 2,
  },
  APPROVED: {
    label: 'Aprobada por Gerencia',
    badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    desc: 'Lista para despacho formal al proveedor.',
    step: 3,
  },
  ISSUED: {
    label: 'Emitida / Enviada',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    desc: 'Transmitida al proveedor con PDF y notificación.',
    step: 4,
  },
  CONFIRMED: {
    label: 'Confirmada por Proveedor',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    desc: 'Proveedor confirmó disponibilidad y fechas.',
    step: 5,
  },
  IN_TRANSIT: {
    label: 'En Tránsito',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    desc: 'Guía de transporte activa hacia muelle de recepción.',
    step: 6,
  },
  PARTIALLY_RECEIVED: {
    label: 'Recibida Parcial',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    desc: 'Faltantes pendientes de entrega.',
    step: 7,
  },
  RECEIVED: {
    label: 'Recibida / Completada',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    desc: '100% ingresado a kárdex de inventario.',
    step: 8,
  },
  CANCELLED: {
    label: 'Cancelada',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    desc: 'Anulada o rechazada.',
    step: 0,
  },
};

export function PurchasesClient() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'RECEIVING' | 'RETURNS' | 'ANALYTICS'>('ORDERS');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
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
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Configuración de Aprobación Multinivel
  const [approvalThreshold, setApprovalThreshold] = useState<number>(10000000);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State para Creación
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

  // Selector de productos del catálogo del proveedor
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [itemQtyToAdd, setItemQtyToAdd] = useState(1);
  const [itemPriceToAdd, setItemPriceToAdd] = useState(0);
  const [itemDiscToAdd, setItemDiscToAdd] = useState(0);
  const [itemTaxToAdd, setItemTaxToAdd] = useState(19);

  // Form State para Recepción de Mercancía en Muelle
  const [receivingData, setReceivingData] = useState({
    purchaseOrderId: '',
    carrierName: '',
    trackingGuide: '',
    deliveryNoteRef: '',
    notes: '',
    items: [] as any[],
  });

  // Carga de datos
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordRes, supRes, recRes, retRes, anaRes] = await Promise.all([
        fetch('/api/purchases').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
        fetch('/api/purchases/receipts').then((r) => r.json()),
        fetch('/api/purchases/returns').then((r) => r.json()),
        fetch('/api/purchases/analytics').then((r) => r.json()),
        fetch('/api/governance/financial-policies').then((r) => r.json()),
      ]);

      if (ordRes.success) {
        setOrders(ordRes.orders);
        if (ordRes.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(ordRes.orders[0]);
        }
      }
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (recRes.success) setReceipts(recRes.receipts);
      if (retRes.success) setReturns(retRes.returns);
      if (anaRes.success) setAnalytics(anaRes.analytics);
      if (arguments[0]?.[5]?.success && arguments[0]?.[5]?.policies?.approvalThreshold) setApprovalThreshold(arguments[0][5].policies.approvalThreshold);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Al seleccionar proveedor, precargar su catálogo
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

  const handleSelectProductChange = (productId: string) => {
    setSelectedProductToAdd(productId);
    const prod = availableProducts.find((p) => p.id === productId);
    if (prod) {
      setItemPriceToAdd(prod.purchasePrice || 0);
      setItemTaxToAdd(prod.taxRatePct ?? 19);
      setItemQtyToAdd(prod.minOrderQty || 1);
    }
  };

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

  // Guardar Orden de Compra
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debes agregar al menos un artículo a la orden de compra.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        // Validación de aprobación multinivel: si supera el umbral, pasa a PENDING_APPROVAL
        if (computedFormTotals.total >= approvalThreshold) {
          await fetch(`/api/purchases/${data.order.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
          });
        }
        setIsCreateModalOpen(false);
        await fetchAllData();
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

  // Acciones de Flujo de Aprobación y Ciclo de Vida
  const handleOrderAction = async (action: string, orderId: string, customPayload?: any) => {
    try {
      const res = await fetch(`/api/purchases/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...customPayload }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAllData();
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

  // Abrir Modal de Recepción en Muelle
  const openReceivingModal = (order: PurchaseOrder) => {
    setReceivingData({
      purchaseOrderId: order.id,
      carrierName: order.shippingMethod || 'Transportes Nacionales',
      trackingGuide: '',
      deliveryNoteRef: '',
      notes: '',
      items: order.items.map((it) => ({
        productId: it.productId,
        internalSku: it.internalSku,
        name: it.name,
        orderedQty: it.quantity,
        receivedQty: it.quantity,
        acceptedQty: it.quantity,
        rejectedQty: 0,
        rejectionReason: '',
        unitPrice: it.unitPrice,
        lotNumber: `LT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: '',
      })),
    });
    setIsReceiveModalOpen(true);
  };

  // Procesar Recepción de Mercancías
  const handleExecuteReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/purchases/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receivingData),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsReceiveModalOpen(false);
        await fetchAllData();
        setActiveTab('RECEIVING');
      } else {
        alert(data.error || 'Error al recibir mercancía');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      {/* ── Cabecera Quantum Enterprise (Estilo Home / Dashboard) ── */}
      <InteractiveSpotlight
        className="relative z-10 ds-card group"
        style={{ padding: '2rem 2.5rem' }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute top-4 right-4 font-mono text-xs text-slate-600 uppercase tracking-widest">[OPS_PUR · SRM]</div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="mb-2">
              <span className="ds-badge ds-badge-teal">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                </span>
                <Sparkles size={8} /> Aprovisionamiento, Recepción & Control de Calidad
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white">
              Centro Integral de{" "}
              <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">
                Compras & SRM
              </span>
            </h1>
            <p className="ds-subtext mt-1 max-w-3xl">
              Flujo unificado: Desde la requisición aprobada por gerencia hasta la recepción física en muelle, contrastación de cantidades pedidas vs entregadas y gestión de rechazos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs text-teal-400 uppercase tracking-widest hover:border-teal-500/60 transition"
              style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => {
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
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_-5px_rgba(20,184,166,0.4)] transition transform active:scale-95"
            >
              <Plus size={15} />
              Nueva Orden de Compra
            </button>
          </div>
        </div>

        {/* ── 4 Pilares de Navegación del Módulo ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activeTab === 'ORDERS'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Órdenes de Compra</span>
              <ShoppingCart size={15} className={activeTab === 'ORDERS' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{orders.length}</div>
            <span className="text-[10px] font-mono text-slate-400">Emisión y aprobaciones</span>
          </button>

          <button
            onClick={() => setActiveTab('RECEIVING')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activeTab === 'RECEIVING'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Recepción en Muelle</span>
              <ClipboardCheck size={15} className={activeTab === 'RECEIVING' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{receipts.length}</div>
            <span className="text-[10px] font-mono text-slate-400">Inspección vs lo pedido</span>
          </button>

          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activeTab === 'RETURNS'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Devoluciones / Rechazos</span>
              <RotateCcw size={15} className={activeTab === 'RETURNS' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{returns.length}</div>
            <span className="text-[10px] font-mono text-slate-400">Notas crédito y garantías</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`p-4 rounded-sm text-left transition relative border ${
              activeTab === 'ANALYTICS'
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-400 shadow-sm'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Reportes & Desempeño</span>
              <BarChart3 size={15} className={activeTab === 'ANALYTICS' ? 'text-teal-400' : 'text-slate-500'} />
            </div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {analytics?.acceptanceRatePct ?? 100}%
            </div>
            <span className="text-[10px] font-mono text-slate-400">OTIF y costos por proveedor</span>
          </button>
        </div>
      </InteractiveSpotlight>

      {/* ── Pestaña 1: GESTIÓN DE ÓRDENES Y FLUJO MULTINIVEL ─────────────── */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          {/* Barra de Filtros */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por número de orden (OC-2026-...), proveedor o NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

          {/* Grilla Split: Listado Izquierdo + Dossier Derecho */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Lista de Órdenes */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
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
                          <Building2 size={11} /> NIT: {order.vendorNit || 'N/A'}
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
                        <span>{order.items?.length || 0} artículos</span>
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

            {/* Dossier de la Orden */}
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
                        Destino: {selectedOrder.warehouseName || 'Bodega Central'} • Plazo: {selectedOrder.paymentTermsDays} días crédito
                      </p>
                    </div>

                    {/* Flujo Multinivel de Acciones */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Caso 1: Requiere aprobación si supera el umbral */}
                      {selectedOrder.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleOrderAction('ISSUE', selectedOrder.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition shadow-md"
                        >
                          <ShieldCheck size={14} />
                          APROBAR POR GERENCIA
                        </button>
                      )}

                      {/* Caso 2: En Borrador o Aprobada -> Emitir / Transmitir al Proveedor */}
                      {['DRAFT', 'APPROVED'].includes(selectedOrder.status) && (
                        <button
                          onClick={() => {
                            if (selectedOrder.total >= approvalThreshold && selectedOrder.status === 'DRAFT') {
                              handleOrderAction('UPDATE_STATUS', selectedOrder.id, { status: 'PENDING_APPROVAL' });
                            } else {
                              handleOrderAction('ISSUE', selectedOrder.id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          <Send size={13} />
                          {selectedOrder.total >= approvalThreshold && selectedOrder.status === 'DRAFT'
                            ? 'SOLICITAR APROBACIÓN GERENCIAL'
                            : 'ENVIAR AL PROVEEDOR'}
                        </button>
                      )}

                      {/* Caso 3: Emitida -> Confirmar por Proveedor */}
                      {selectedOrder.status === 'ISSUED' && (
                        <button
                          onClick={() => handleOrderAction('CONFIRM', selectedOrder.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          <CheckCircle2 size={13} />
                          CONFIRMAR ACUERDO
                        </button>
                      )}

                      {/* Caso 4: Confirmada -> Marcar en Tránsito */}
                      {selectedOrder.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleOrderAction('IN_TRANSIT', selectedOrder.id)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          <Truck size={13} />
                          MARCAR EN TRÁNSITO
                        </button>
                      )}

                      {/* Caso 5: En Tránsito o Parcial -> BOTÓN DE RECEPCIÓN EN MUELLE */}
                      {['IN_TRANSIT', 'PARTIALLY_RECEIVED', 'CONFIRMED'].includes(selectedOrder.status) && (
                        <button
                          onClick={() => openReceivingModal(selectedOrder)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg shadow-emerald-600/20"
                        >
                          <ClipboardCheck size={14} />
                          RECIBIR EN MUELLE
                        </button>
                      )}

                      {['DRAFT', 'PENDING_APPROVAL', 'ISSUED'].includes(selectedOrder.status) && (
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

                  {/* Banner de Aprobación si supera umbral */}
                  {selectedOrder.total >= approvalThreshold && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
                      <ShieldCheck size={18} className="text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold">Política de Control Financiero Activa:</span> Esta orden supera los{' '}
                        ${approvalThreshold.toLocaleString('es-CO')} COP y requiere aprobación previa por Gerencia.
                      </div>
                    </div>
                  )}

                  {/* Datos de Proveedor & Condiciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-1.5 text-xs">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building2 size={13} className="text-teal-400" /> Proveedor
                      </span>
                      <div className="text-sm font-bold text-foreground">{selectedOrder.vendorName}</div>
                      <div className="text-muted-foreground">NIT: {selectedOrder.vendorNit || 'N/A'}</div>
                      {selectedOrder.vendorEmail && (
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Mail size={12} /> {selectedOrder.vendorEmail}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-1.5 text-xs">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Truck size={13} className="text-indigo-400" /> Condiciones Comerciales
                      </span>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Incoterm 2020:</span>
                        <span className="font-bold text-foreground">
                          {selectedOrder.incoterm || 'DAP'} {selectedOrder.incotermPlace ? `(${selectedOrder.incotermPlace})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método de Envío:</span>
                        <span className="font-bold text-foreground">{selectedOrder.shippingMethod || 'Terrestre'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Artículos Solicitados */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={14} className="text-teal-400" />
                      Artículos Solicitados ({selectedOrder.items?.length || 0})
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="p-3">SKU / Descripción</th>
                            <th className="p-3 text-center">Cant.</th>
                            <th className="p-3 text-right">Unitario</th>
                            <th className="p-3 text-center">Desc %</th>
                            <th className="p-3 text-center">IVA %</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="p-3">
                                <div className="font-bold text-foreground">{item.name}</div>
                                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                                  <span>SKU: {item.internalSku}</span>
                                  {item.barcode && <span>• Barcode: {item.barcode}</span>}
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold text-foreground">
                                {item.quantity} {item.purchaseUnit}
                              </td>
                              <td className="p-3 text-right font-mono">${item.unitPrice.toLocaleString('es-CO')}</td>
                              <td className="p-3 text-center text-muted-foreground">{item.discountPct}%</td>
                              <td className="p-3 text-center text-muted-foreground">{item.taxRatePct}%</td>
                              <td className="p-3 text-right font-bold font-mono text-foreground">
                                ${item.total.toLocaleString('es-CO')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Liquidación Económica */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-border/80 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-1.5 max-w-sm text-xs text-muted-foreground">
                      <span className="font-bold uppercase text-foreground">Notas de Entrega</span>
                      <p>{selectedOrder.notes || 'Sin especificaciones adicionales para el transportista.'}</p>
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
                      <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border">
                        <span>TOTAL GENERAL:</span>
                        <span className="font-mono text-teal-400">
                          ${selectedOrder.total.toLocaleString('es-CO')} {selectedOrder.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Pestaña 2: HISTORIAL DE RECEPCIÓN EN MUELLE ──────────────────── */}
      {activeTab === 'RECEIVING' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Actas de Recepción en Muelle (Cross-Docking)</h2>
              <p className="text-xs text-muted-foreground">
                Trazabilidad de remisiones, transportistas e inspección física contra órdenes de compra.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3.5">Acta / Consecutivo</th>
                  <th className="p-3.5">Orden de Compra</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5">Transportista / Guía</th>
                  <th className="p-3.5 text-center">Ítems Recibidos</th>
                  <th className="p-3.5">Recibido Por</th>
                  <th className="p-3.5">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-mono font-bold text-foreground">{rec.receiptNumber}</td>
                    <td className="p-3.5 font-mono text-teal-400">{rec.orderNumber}</td>
                    <td className="p-3.5 font-bold text-foreground">{rec.vendorName}</td>
                    <td className="p-3.5 text-muted-foreground">
                      {rec.carrierName || 'Directo'} {rec.trackingGuide ? `(#${rec.trackingGuide})` : ''}
                    </td>
                    <td className="p-3.5 text-center font-bold text-foreground">
                      {Array.isArray(rec.items) ? rec.items.length : 0} artículos
                    </td>
                    <td className="p-3.5 text-muted-foreground">{rec.receivedBy || 'Operario Bodega'}</td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(rec.receivedAt).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aún no hay recepciones registradas en muelle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pestaña 3: DEVOLUCIONES Y RECHAZOS ────────────────────────────── */}
      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Gestión de Rechazos, Devoluciones y Garantías</h2>
              <p className="text-xs text-muted-foreground">
                Artículos rechazados en muelle por avería o no conformidad, con seguimiento a notas de crédito.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3.5">Devolución #</th>
                  <th className="p-3.5">Orden de Compra</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5">Motivo / Tipo</th>
                  <th className="p-3.5 text-right">Monto a Reembolsar</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5">Nota Crédito Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-mono font-bold text-rose-400">{ret.returnNumber}</td>
                    <td className="p-3.5 font-mono text-foreground">{ret.orderNumber}</td>
                    <td className="p-3.5 font-bold text-foreground">{ret.vendorName}</td>
                    <td className="p-3.5 text-muted-foreground">{ret.returnType}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-foreground">
                      ${ret.totalRefund?.toLocaleString('es-CO') || 0}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {ret.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted-foreground">{ret.creditNoteRef || 'Pendiente'}</td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Sin devoluciones o rechazos pendientes. Tasa de calidad al 100%.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pestaña 4: REPORTES Y DESEMPEÑO DE COMPRAS (ANALYTICS) ────────── */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Gasto Total Acumulado</span>
              <div className="text-2xl font-black text-foreground mt-1">
                ${analytics.totalSpend?.toLocaleString('es-CO')} <span className="text-xs text-muted-foreground font-normal">COP</span>
              </div>
              <p className="text-[11px] text-teal-400 mt-1">Compras netas consolidadas</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Tasa de Aceptación en Muelle</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{analytics.acceptanceRatePct}%</div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {analytics.totalItemsAccepted} ítems aprobados / {analytics.totalItemsRejected} rechazados
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Eficiencia de Proveedores</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">{analytics.topSuppliers?.length || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Socios comerciales analizados</p>
            </div>
          </div>

          {/* Ranking de Proveedores por Gasto y Cumplimiento OTIF */}
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-teal-400" />
              Desempeño y Cumplimiento por Proveedor (OTIF & Spend)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3.5">Proveedor</th>
                    <th className="p-3.5 text-center">Órdenes Emitidas</th>
                    <th className="p-3.5 text-center">Tasa Cumplimiento (%)</th>
                    <th className="p-3.5 text-right">Volumen Facturado (COP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {analytics.topSuppliers?.map((sup: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="p-3.5 font-bold text-foreground">{sup.vendorName}</td>
                      <td className="p-3.5 text-center font-mono">{sup.ordersCount}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">{sup.fulfillmentRatePct}%</td>
                      <td className="p-3.5 text-right font-mono font-bold text-foreground">
                        ${sup.totalSpent?.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: RECEPCIÓN DE MERCANCÍAS EN MUELLE (CONTRASTAR PEDIDO VS RECIBIDO) ── */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-border rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    Inspección y Recepción en Muelle de Descarga
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Contrasta las cantidades pedidas vs entregadas. Separa unidades aceptadas de rechazadas para kárdex.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteReceipt} className="space-y-6">
              {/* Datos de Transportista y Remisión */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Transportista</label>
                  <input
                    type="text"
                    value={receivingData.carrierName}
                    onChange={(e) => setReceivingData({ ...receivingData, carrierName: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none"
                    placeholder="Ej: Servientrega / Coordinadora"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Guía de Despacho</label>
                  <input
                    type="text"
                    value={receivingData.trackingGuide}
                    onChange={(e) => setReceivingData({ ...receivingData, trackingGuide: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none"
                    placeholder="Número de guía"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Número Remisión Proveedor
                  </label>
                  <input
                    type="text"
                    value={receivingData.deliveryNoteRef}
                    onChange={(e) => setReceivingData({ ...receivingData, deliveryNoteRef: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-900 border border-border text-foreground focus:outline-none"
                    placeholder="Albarán de entrega"
                  />
                </div>
              </div>

              {/* Inspección Ítem por Ítem */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Verificación de Artículos y Control de Lotes
                </h3>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="p-3">Artículo / SKU</th>
                        <th className="p-3 text-center">Pedido</th>
                        <th className="p-3 text-center">Físico Recibido</th>
                        <th className="p-3 text-center">Aceptado (Kárdex)</th>
                        <th className="p-3 text-center">Rechazado</th>
                        <th className="p-3">Lote Asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {receivingData.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{it.name}</div>
                            <span className="text-[10px] font-mono text-muted-foreground">{it.internalSku}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-muted-foreground">{it.orderedQty}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.receivedQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newItems = [...receivingData.items];
                                newItems[idx].receivedQty = val;
                                newItems[idx].acceptedQty = val;
                                setReceivingData({ ...receivingData, items: newItems });
                              }}
                              className="w-16 px-2 py-1 text-xs text-center rounded-lg bg-slate-900 border border-border text-foreground font-mono"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.acceptedQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newItems = [...receivingData.items];
                                newItems[idx].acceptedQty = val;
                                newItems[idx].rejectedQty = Math.max(0, newItems[idx].receivedQty - val);
                                setReceivingData({ ...receivingData, items: newItems });
                              }}
                              className="w-16 px-2 py-1 text-xs text-center rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.rejectedQty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newItems = [...receivingData.items];
                                newItems[idx].rejectedQty = val;
                                setReceivingData({ ...receivingData, items: newItems });
                              }}
                              className="w-16 px-2 py-1 text-xs text-center rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={it.lotNumber}
                              onChange={(e) => {
                                const newItems = [...receivingData.items];
                                newItems[idx].lotNumber = e.target.value;
                                setReceivingData({ ...receivingData, items: newItems });
                              }}
                              className="w-28 px-2 py-1 text-[11px] rounded-lg bg-slate-900 border border-border text-foreground font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de Confirmación */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando Entrada...' : 'CONFIRMAR INGRESO A KÁRDEX'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Creación de Orden de Compra ──────────────────────────── */}
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
                    Flujo sincronizado con el catálogo técnico del proveedor y validación de límites de crédito.
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
              {/* Selector de Proveedor & Bodega */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Proveedor Homologado *
                  </label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
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
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
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
                    Divisa de Compra *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                  >
                    {ALL_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Incoterms y Condiciones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
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
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Lugar Convenido</label>
                  <input
                    type="text"
                    placeholder="Puerto / Terminal"
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

              {/* Constructor de Artículos desde Catálogo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Boxes size={14} className="text-teal-400" />
                    Artículos a Ordenar ({formData.items.length})
                  </h3>
                </div>

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
                        <option value="">Seleccione proveedor para ver catálogo</option>
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
                          <td className="p-2.5 font-bold text-foreground">{it.name}</td>
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
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Liquidación Final */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Observaciones para el Proveedor
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none"
                    placeholder="Referencias de cotización o detalles de entrega..."
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.items.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'CREAR ORDEN DE COMPRA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
