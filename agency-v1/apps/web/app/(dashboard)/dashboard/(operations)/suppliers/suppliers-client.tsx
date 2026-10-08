'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  FileCheck2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Upload,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  FileText,
  BadgeAlert,
  RefreshCw,
  X,
  FileDown,
  Percent,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  Package,
  Truck,
  Globe2,
  Receipt,
  Scale,
  Users2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
  ArrowUpRight,
  Activity,
  Wifi,
  Coins,
  ImageIcon,
  Ban,
  CheckCircle,
  Power
} from 'lucide-react';

// ── Lista Exhaustiva de Incoterms 2020 Oficiales ─────────────────────────────
export const ALL_INCOTERMS = [
  { code: 'EXW', name: 'Ex Works', mode: 'Cualquier modo', desc: 'En fábrica/almacén del vendedor. El comprador asume todos los costos y riesgos.' },
  { code: 'FCA', name: 'Free Carrier', mode: 'Cualquier modo', desc: 'Franco porteador en punto acordado. El vendedor despacha para exportación.' },
  { code: 'CPT', name: 'Carriage Paid To', mode: 'Cualquier modo', desc: 'Transporte pagado hasta destino acordado por el vendedor.' },
  { code: 'CIP', name: 'Carriage and Insurance Paid To', mode: 'Cualquier modo', desc: 'Transporte y seguro amplio (Cláusula A) pagados hasta destino.' },
  { code: 'DAP', name: 'Delivered at Place', mode: 'Cualquier modo', desc: 'Entregado en lugar convenido, listo para descarga por el comprador.' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', mode: 'Cualquier modo', desc: 'Entregado y descargado en terminal/almacén convenido.' },
  { code: 'DDP', name: 'Delivered Duty Paid', mode: 'Cualquier modo', desc: 'Máxima obligación del vendedor: flete, seguro y aranceles/impuestos pagos.' },
  { code: 'FAS', name: 'Free Alongside Ship', mode: 'Marítimo / Vías navegables', desc: 'Franco al costado del buque en el puerto de embarque convenido.' },
  { code: 'FOB', name: 'Free On Board', mode: 'Marítimo / Vías navegables', desc: 'Franco a bordo del buque en el puerto de embarque convenido.' },
  { code: 'CFR', name: 'Cost and Freight', mode: 'Marítimo / Vías navegables', desc: 'Costo de mercancía y flete marítimo principal cubiertos hasta puerto destino.' },
  { code: 'CIF', name: 'Cost, Insurance and Freight', mode: 'Marítimo / Vías navegables', desc: 'Costo, seguro marítimo y flete pagados por el vendedor hasta puerto destino.' }
];

// ── Lista Universal de Divisas Internacionales (ISO 4217) ───────────────────
export const ALL_CURRENCIES = [
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro (Zona Euro)', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷' },
  { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$', flag: '🇨🇱' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪' },
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥', flag: '🇯🇵' },
  { code: 'CNY', name: 'Yuan Chino', symbol: '¥', flag: '🇨🇳' },
  { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$', flag: '🇦🇺' },
  { code: 'AED', name: 'Dírham de Emiratos', symbol: 'AED', flag: '🇦🇪' },
];

export const SUPPLIER_STATUSES = [
  { key: 'ACTIVE', label: 'Activado / Operativo', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'INACTIVE', label: 'Desactivado', badgeColor: 'bg-slate-700/30 text-slate-400 border-slate-700' },
  { key: 'UNDER_REVIEW', label: 'En Auditoría / Revisión', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { key: 'SUSPENDED', label: 'Suspendido Temporalmente', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { key: 'BLOCKED', label: 'Bloqueado por Incumplimiento', badgeColor: 'bg-red-950 text-red-400 border-red-700' },
];

interface SupplierDocument {
  id: string;
  documentType: string;
  title: string;
  fileUrl: string;
  expiryDate?: string | null;
  isVerified: boolean;
  status: string;
}

interface DepartmentContact {
  department: string;
  contactName: string;
  email: string;
  phone: string;
}

interface AccountBalance {
  currentBalance: number;
  pendingInvoices: number;
  lastPaymentDate?: string | null;
}

interface DeliveryTerms {
  shippingMethod: 'TERRESTRE' | 'AEREO' | 'MARITIMO' | 'MULTIMODAL';
  leadTimeDays: number;
  pickupAddress?: string;
}

interface DelayPenaltyPolicy {
  penaltyPctPerDay: number;
  maxPenaltyPct: number;
  gracePeriodDays: number;
}

interface SupplierItem {
  id: string;
  name: string;
  commercialName?: string;
  legalName?: string | null;
  taxId: string;
  taxType: string;
  category: string;
  logoUrl?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  mobilePhone?: string;
  address?: string | null;
  city?: string | null;
  country: string;
  paymentTermsDays: number;
  creditLimit: number;
  currency: string;
  bankName?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  discountRatePct: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'BLOCKED';
  ratingScore: number;
  rawMaterialsScope?: string[];
  specialTaxRegime?: string;
  departmentContacts?: DepartmentContact[];
  accountBalance?: AccountBalance;
  deliveryTerms?: DeliveryTerms;
  incoterm?: string;
  delayPenaltyPolicy?: DelayPenaltyPolicy;
  documents?: SupplierDocument[];
  compliance?: {
    compliant: boolean;
    missingMandatoryDocs: string[];
    expiredDocs: string[];
  };
}

export function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [incotermFilter, setIncotermFilter] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Modales y Pestaña activa
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [activeTabDossier, setActiveTabDossier] = useState<'GENERAL' | 'FINANCIAL' | 'LOGISTICS' | 'CONTACTS' | 'DOCS'>('GENERAL');

  // Form State Completo para Alta y Edición
  const [formData, setFormData] = useState({
    name: '',
    commercialName: '',
    legalName: '',
    taxId: '',
    taxType: 'NIT',
    category: 'RAW_MATERIALS',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'BLOCKED',
    logoUrl: '',
    rawMaterialsScope: 'Café Grano Verde Especial, Miel Orgánica, Empaques Kraft, Válvulas Aromáticas',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    mobilePhone: '',
    address: '',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    currency: 'COP',
    paymentTermsDays: 30,
    creditLimit: 25000000,
    discountRatePct: 3.0,
    specialTaxRegime: 'REGIMEN_ORDINARIO',
    bankName: 'Bancolombia',
    bankAccountType: 'CORRIENTE',
    bankAccountNumber: '',
    bankAccountHolder: '',
    shippingMethod: 'TERRESTRE' as 'TERRESTRE' | 'AEREO' | 'MARITIMO' | 'MULTIMODAL',
    leadTimeDays: 4,
    incoterm: 'DDP',
    penaltyPctPerDay: 0.5,
    maxPenaltyPct: 10,
    gracePeriodDays: 2,
    contactSalesName: '',
    contactSalesEmail: '',
    contactSalesPhone: '',
    contactBillingName: '',
    contactBillingEmail: '',
    contactBillingPhone: '',
    contactLogisticsName: '',
    contactLogisticsEmail: '',
    contactLogisticsPhone: '',
    notes: '',
  });

  // Form Documento
  const [docFormData, setDocFormData] = useState({
    documentType: 'RUT',
    title: '',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        if (data.suppliers) {
          setSuppliers(data.suppliers);
          if (data.suppliers.length > 0) {
            setSelectedSupplier(prev => prev ? data.suppliers.find((x: any) => x.id === prev.id) || data.suppliers[0] : data.suppliers[0]);
          }
        }
      }
    } catch (err) {
      console.warn('[SuppliersClient] Error al cargar proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleRegisterSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.commercialName || formData.name,
        commercialName: formData.commercialName || formData.name,
        legalName: formData.legalName || formData.commercialName || formData.name,
        taxId: formData.taxId,
        taxType: formData.taxType,
        category: formData.category,
        status: formData.status,
        logoUrl: formData.logoUrl,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        mobilePhone: formData.mobilePhone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        currency: formData.currency,
        paymentTermsDays: Number(formData.paymentTermsDays),
        creditLimit: Number(formData.creditLimit),
        discountRatePct: Number(formData.discountRatePct),
        specialTaxRegime: formData.specialTaxRegime,
        bankName: formData.bankName,
        bankAccountType: formData.bankAccountType,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountHolder: formData.bankAccountHolder || formData.legalName,
        notes: formData.notes,
        rawMaterialsScope: formData.rawMaterialsScope.split(',').map(s => s.trim()).filter(Boolean),
        deliveryTerms: {
          shippingMethod: formData.shippingMethod,
          leadTimeDays: Number(formData.leadTimeDays),
        },
        incoterm: formData.incoterm,
        delayPenaltyPolicy: {
          penaltyPctPerDay: Number(formData.penaltyPctPerDay),
          maxPenaltyPct: Number(formData.maxPenaltyPct),
          gracePeriodDays: Number(formData.gracePeriodDays),
        },
        departmentContacts: [
          formData.contactSalesName && { department: 'VENTAS', contactName: formData.contactSalesName, email: formData.contactSalesEmail, phone: formData.contactSalesPhone },
          formData.contactBillingName && { department: 'CARTERA', contactName: formData.contactBillingName, email: formData.contactBillingEmail, phone: formData.contactBillingPhone },
          formData.contactLogisticsName && { department: 'LOGISTICA', contactName: formData.contactLogisticsName, email: formData.contactLogisticsEmail, phone: formData.contactLogisticsPhone },
        ].filter(Boolean),
        accountBalance: {
          currentBalance: 0,
          pendingInvoices: 0,
          lastPaymentDate: null,
        }
      };

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.supplier) {
        setSuppliers([data.supplier, ...suppliers]);
        setSelectedSupplier(data.supplier);
        setIsRegisterModalOpen(false);
        alert('✅ Proveedor maestro y parámetros de comercio exterior registrados exitosamente.');
      } else {
        alert(data.error || 'Error al registrar proveedor.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTargetSelectedSupplier = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (!res.ok || !result.url) {
        throw new Error(result.error || 'Fallo en la subida del logotipo.');
      }

      const uploadedUrl = result.url;

      if (isTargetSelectedSupplier && selectedSupplier) {
        // Actualizar proveedor existente
        const patchRes = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoUrl: uploadedUrl }),
        });
        const patchData = await patchRes.json();
        if (patchRes.ok) {
          const updated = { ...selectedSupplier, logoUrl: uploadedUrl };
          setSelectedSupplier(updated);
          setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
          alert('✅ Logotipo actualizado exitosamente.');
        } else {
          alert(patchData.error || 'No se pudo actualizar el logotipo del proveedor.');
        }
      } else {
        // En modal de creación
        setFormData(prev => ({ ...prev, logoUrl: uploadedUrl }));
        alert('✅ Logotipo cargado listo para asociar al nuevo proveedor.');
      }
    } catch (err: any) {
      alert('Error al subir imagen: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleUpdateStatus = async (supplierId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedList = suppliers.map(s => s.id === supplierId ? { ...s, status: newStatus as any } : s);
        setSuppliers(updatedList);
        if (selectedSupplier && selectedSupplier.id === supplierId) {
          setSelectedSupplier({ ...selectedSupplier, status: newStatus as any });
        }
      } else {
        alert(data.error || 'No se pudo actualizar el estado del proveedor.');
      }
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const handleAttachDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${selectedSupplier.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docFormData),
      });
      const data = await res.json();
      if (res.ok && data.document) {
        const updatedDocs = [data.document, ...(selectedSupplier.documents || [])];
        const updated = { ...selectedSupplier, documents: updatedDocs };
        setSelectedSupplier(updated);
        setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
        setIsDocModalOpen(false);
        setDocFormData({ documentType: 'RUT', title: '', fileUrl: '', expiryDate: '', notes: '' });
        alert('✅ Documento legal certificado y adjuntado al expediente.');
      } else {
        alert(data.error || 'Error al adjuntar documento.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja este proveedor? Esta acción requiere permisos de administrador.')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        const nextSuppliers = suppliers.filter(s => s.id !== id);
        setSuppliers(nextSuppliers);
        setSelectedSupplier(nextSuppliers[0] || null);
        alert('🗑️ Proveedor eliminado del catálogo maestro.');
      } else {
        alert(data.error || 'No se pudo eliminar el proveedor.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      (s.legalName && s.legalName.toLowerCase().includes(term)) ||
      s.taxId.toLowerCase().includes(term) ||
      (s.contactEmail && s.contactEmail.toLowerCase().includes(term)) ||
      (s.city && s.city.toLowerCase().includes(term));

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesCurrency = currencyFilter === 'ALL' || s.currency === currencyFilter;
    const matchesIncoterm = incotermFilter === 'ALL' || s.incoterm === incotermFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesCurrency && matchesIncoterm;
  });

  const compliantCount = suppliers.filter(s => s.compliance?.compliant).length;
  const underReviewCount = suppliers.filter(s => s.status === 'UNDER_REVIEW').length;
  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white font-sans overflow-hidden space-y-8 pb-20">
      {/* ── 0. QUANTUM CYBER GRID & GLOW EFFECT (Landing Page Style) ──────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[100%] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.12)_0%,transparent_60%)] pointer-events-none -z-10" />

      {/* ── 1. HUD STATUS BADGE & HERO BANNER ─────────────────────────────────── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-slate-900/80 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold text-teal-300 uppercase tracking-widest font-mono shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>SRM PROCUREMENT PROTOCOL // INCOTERMS 2020</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 border border-slate-800 px-2.5 py-1 bg-slate-900/50 rounded-full">
              <Wifi size={11} className="text-teal-400 animate-pulse" /> NETWORK SECURED
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Portal Maestro de <span className="font-mono text-transparent bg-clip-text bg-[linear-gradient(110deg,#0d9488,45%,#34d399,55%,#0d9488)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]">Proveedores</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl font-mono uppercase tracking-wide">
            Fiscalización documental, 11 reglas Incoterms globales, matriz multi-divisas ISO 4217 y gobernanza RBAC.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchSuppliers}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition border border-slate-800 hover:border-teal-500/30 shadow-sm"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-teal-400' : ''} /> SYNC DATA
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition shadow-[0_0_25px_-5px_rgba(20,184,166,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={15} /> NUEVO PROVEEDOR
          </button>
        </div>
      </div>

      {/* ── 2. STATS & KPI HUD CARDS (Glassmorphism & Neon Borders) ─────────── */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Catálogo Homologado</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3 font-mono">{suppliers.length}</div>
          <div className="text-[11px] text-teal-400 font-mono mt-1 flex items-center gap-1">
            <Activity size={11} /> Registro Activo en BD
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Proveedores Activos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Power size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3 font-mono">
            {activeCount} <span className="text-xs font-normal text-slate-500">/ {suppliers.length}</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            Operando en órdenes y compras
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Compliance DIAN/RUT</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-400 mt-3 font-mono">
            {suppliers.length > 0 ? Math.round((compliantCount / suppliers.length) * 100) : 100}%
          </div>
          <div className="text-[11px] text-teal-400 font-mono mt-1">
            {compliantCount} de {suppliers.length} expedientes 100% al día
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">En Auditoría SRM</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3 font-mono">{underReviewCount}</div>
          <div className="text-[11px] text-amber-400 font-mono mt-1">
            Pendiente certificar cuenta o RUT
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Multi-Divisas Soportadas</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-400 mt-3 font-mono">14 Divisas</div>
          <div className="text-[11px] text-sky-400 font-mono mt-1">
            COP, USD, EUR, GBP, CAD + 11 Incoterms
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE: DIRECTORY & DOSSIER (BENTO SPLIT VIEW) ─────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Directory & Advanced Filters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <SlidersHorizontal size={14} /> Filtros de Auditoría ({filteredSuppliers.length})
              </h2>
              <span className="text-[10px] font-mono text-slate-500">ISO 4217 & INCOTERMS</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por Razón Social, NIT, Ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-teal-500 font-mono"
              >
                <option value="ALL">Rubro (Todos)</option>
                <option value="RAW_MATERIALS">Materia Prima</option>
                <option value="PACKAGING">Empaques</option>
                <option value="SERVICES">Servicios</option>
                <option value="LOGISTICS">Logística</option>
                <option value="TECHNOLOGY">Tecnología</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-emerald-400 focus:outline-none focus:border-teal-500 font-mono font-bold"
              >
                <option value="ALL">Estado (Todos)</option>
                {SUPPLIER_STATUSES.map(st => (
                  <option key={st.key} value={st.key}>{st.label}</option>
                ))}
              </select>

              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-teal-400 focus:outline-none focus:border-teal-500 font-mono font-bold"
              >
                <option value="ALL">Divisa (Todas)</option>
                {ALL_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>

              <select
                value={incotermFilter}
                onChange={(e) => setIncotermFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-amber-400 focus:outline-none focus:border-teal-500 font-mono font-bold"
              >
                <option value="ALL">Incoterm (Todos)</option>
                {ALL_INCOTERMS.map(i => (
                  <option key={i.code} value={i.code}>{i.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Supplier Cards */}
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl">
                <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-teal-400" />
                Sincronizando proveedores del clúster PostgreSQL...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl font-mono">
                No se encontraron proveedores con los filtros seleccionados.
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                const isSelected = selectedSupplier?.id === supplier.id;
                const isCompliant = supplier.compliance?.compliant;
                const currObj = ALL_CURRENCIES.find(c => c.code === supplier.currency) || { flag: '🌐', symbol: '$' };

                const statusInfo = SUPPLIER_STATUSES.find(st => st.key === supplier.status) || {
                  label: supplier.status,
                  badgeColor: 'bg-slate-700/30 text-slate-400 border-slate-700'
                };

                return (
                  <div
                    key={supplier.id}
                    onClick={() => setSelectedSupplier(supplier)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/80 shadow-[0_0_30px_-8px_rgba(20,184,166,0.35)] ring-1 ring-teal-500/50'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-teal-500/40 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Logo o Avatar con Glow */}
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-teal-500/40 transition">
                          {supplier.logoUrl ? (
                            <img
                              src={supplier.logoUrl}
                              alt={supplier.commercialName || supplier.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as any).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-teal-400 font-mono font-black text-sm">
                              {(supplier.commercialName || supplier.name).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white tracking-tight">
                              {supplier.commercialName || supplier.name}
                            </h3>
                            {supplier.ratingScore && (
                              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                                <Star size={10} className="fill-amber-400" /> {supplier.ratingScore.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                            <span>{supplier.taxType}: {supplier.taxId}</span>
                            <span>•</span>
                            <span className="text-slate-300">{supplier.city || 'Colombia'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${statusInfo.badgeColor}`}
                        >
                          {supplier.status}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          {supplier.incoterm || 'DDP'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{currObj.flag} {supplier.currency}</span>
                        <span>•</span>
                        <span>Plazo: {supplier.paymentTermsDays}d</span>
                      </div>

                      <div>
                        {isCompliant ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 size={12} /> Certificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                            <AlertTriangle size={12} /> {supplier.compliance?.missingMandatoryDocs.length} faltantes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: High-Tech Supplier Dossier & Inspection */}
        <div className="lg:col-span-7">
          {selectedSupplier ? (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="flex items-start gap-4">
                  {/* Logotipo en Dossier con acción de carga */}
                  <div className="relative group/logo w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                    {selectedSupplier.logoUrl ? (
                      <img
                        src={selectedSupplier.logoUrl}
                        alt={selectedSupplier.commercialName || selectedSupplier.name}
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="text-xl font-mono font-black text-teal-400">
                        {(selectedSupplier.commercialName || selectedSupplier.name).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/70 opacity-0 group-hover/logo:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[9px] font-mono text-teal-300">
                      <Upload size={14} className="mb-0.5" />
                      <span>{isUploadingLogo ? '...' : 'LOGO'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingLogo}
                        onChange={(e) => handleLogoUpload(e, true)}
                      />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {selectedSupplier.commercialName || selectedSupplier.name}
                      </h2>
                      <span className="text-xs font-mono font-bold bg-teal-500/10 text-teal-400 px-2.5 py-0.5 rounded-lg border border-teal-500/30">
                        {selectedSupplier.taxType}: {selectedSupplier.taxId}
                      </span>
                      <span className="text-xs font-mono font-bold bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700">
                        INCOTERM: {selectedSupplier.incoterm || 'DDP'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2">
                      <span className="text-slate-200">Legal:</span> {selectedSupplier.legalName || selectedSupplier.name}
                      <span>•</span>
                      <span>{selectedSupplier.city || 'Bogotá'}, {selectedSupplier.country}</span>
                      <span>•</span>
                      <span className="text-teal-400 font-bold">Divisa: {selectedSupplier.currency}</span>
                    </div>

                    {/* Selector de Estado Operativo */}
                    <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                      <span className="text-slate-500 text-[11px]">Estado SRM:</span>
                      <select
                        value={selectedSupplier.status}
                        onChange={(e) => handleUpdateStatus(selectedSupplier.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none transition ${
                          (SUPPLIER_STATUSES.find(st => st.key === selectedSupplier.status) || SUPPLIER_STATUSES[0]).badgeColor
                        }`}
                      >
                        {SUPPLIER_STATUSES.map(st => (
                          <option key={st.key} value={st.key} className="bg-slate-900 text-white">
                            ● {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700 cursor-pointer">
                    <ImageIcon size={13} className="text-teal-400" />
                    <span>{isUploadingLogo ? 'SUBIENDO...' : 'CAMBIAR LOGO'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingLogo}
                      onChange={(e) => handleLogoUpload(e, true)}
                    />
                  </label>

                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition shadow-md"
                  >
                    <Upload size={13} /> ADJUNTAR DOC
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                    title="Dar de baja proveedor"
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-rose-500/20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs (Futuristic Terminal Style) */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto font-mono text-xs">
                <button
                  onClick={() => setActiveTabDossier('GENERAL')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTabDossier === 'GENERAL'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  1. GENERAL & MATERIA PRIMA
                </button>
                <button
                  onClick={() => setActiveTabDossier('FINANCIAL')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTabDossier === 'FINANCIAL'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  2. BANCARIO, DIVISAS & FISCAL
                </button>
                <button
                  onClick={() => setActiveTabDossier('LOGISTICS')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTabDossier === 'LOGISTICS'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  3. INCOTERMS & PENALIZACIÓN
                </button>
                <button
                  onClick={() => setActiveTabDossier('CONTACTS')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTabDossier === 'CONTACTS'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  4. DEPARTAMENTOS
                </button>
                <button
                  onClick={() => setActiveTabDossier('DOCS')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeTabDossier === 'DOCS'
                      ? 'bg-teal-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  5. EXPEDIENTE ({selectedSupplier.documents?.length || 0})
                </button>
              </div>

              {/* ── TAB CONTENT 1: GENERAL & MATERIA PRIMA ───────────────────── */}
              {activeTabDossier === 'GENERAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="text-xs font-mono font-bold text-teal-400 uppercase flex items-center gap-1.5">
                        <Building2 size={14} /> IDENTIFICACIÓN & PERSONERÍA JURÍDICA
                      </div>
                      <div className="text-xs space-y-1.5 font-mono pt-1 text-slate-300">
                        <div><span className="text-slate-500">Razón Social:</span> <span className="font-bold text-white">{selectedSupplier.name}</span></div>
                        <div><span className="text-slate-500">Nombre Comercial:</span> <span className="text-white">{selectedSupplier.commercialName || selectedSupplier.name}</span></div>
                        <div><span className="text-slate-500">Razón Legal (DIAN):</span> <span className="text-white">{selectedSupplier.legalName || selectedSupplier.name}</span></div>
                        <div><span className="text-slate-500">Doc. Tributario:</span> <span className="text-teal-400 font-bold">{selectedSupplier.taxType} {selectedSupplier.taxId}</span></div>
                        <div><span className="text-slate-500">Sede Principal:</span> <span className="text-white">{selectedSupplier.city || 'Bogotá'}, {selectedSupplier.country}</span></div>
                        <div><span className="text-slate-500">Dirección:</span> <span className="text-white">{selectedSupplier.address || 'No registrada'}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <Package size={14} /> MATERIA PRIMA & INSUMOS HOMOLOGADOS
                      </div>
                      <div className="text-xs text-slate-400 font-mono">Ítems autorizados para órdenes de compra:</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSupplier.rawMaterialsScope && selectedSupplier.rawMaterialsScope.length > 0 ? (
                          selectedSupplier.rawMaterialsScope.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-xs font-mono border border-amber-500/20">
                              📦 {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic font-mono">No se han tipificado insumos específicos para este proveedor.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-teal-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Líneas de Atención Directa</div>
                        <div className="text-slate-400">
                          PBX: {selectedSupplier.contactPhone || 'N/A'} • Móvil/WhatsApp: {selectedSupplier.mobilePhone || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-teal-400 shrink-0" />
                      <div>
                        <div className="font-bold text-white">Canal de Pedidos</div>
                        <div className="text-slate-400">{selectedSupplier.contactEmail || 'No asignado'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB CONTENT 2: FINANCIERO, DIVISAS & BANCARIO ─────────────── */}
              {activeTabDossier === 'FINANCIAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">Plazo de Pago</div>
                      <div className="text-xl font-black text-white font-mono mt-1">
                        {selectedSupplier.paymentTermsDays} días
                      </div>
                      <div className="text-[10px] font-mono text-teal-400 mt-0.5">Vencimiento factura</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">Cupo de Crédito</div>
                      <div className="text-xl font-black text-white font-mono mt-1">
                        ${selectedSupplier.creditLimit.toLocaleString('es-CO')}
                      </div>
                      <div className="text-[10px] font-mono text-teal-400 mt-0.5">Divisa: {selectedSupplier.currency}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">Descuento Negociado</div>
                      <div className="text-xl font-black text-teal-400 font-mono mt-1">
                        {selectedSupplier.discountRatePct}%
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">Pronto pago</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[11px] font-mono text-slate-400">Régimen Especial</div>
                      <div className="text-xs font-bold text-amber-400 font-mono mt-1.5 truncate">
                        {selectedSupplier.specialTaxRegime || 'REGIMEN_ORDINARIO'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">Clasificación DIAN</div>
                    </div>
                  </div>

                  {/* Datos Bancarios Certificados */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono font-bold text-teal-400 uppercase flex items-center gap-1.5">
                      <CreditCard size={15} /> DATOS BANCARIOS OFICIALES PARA DISPERSIÓN DE PAGOS
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-slate-400 text-[11px]">Entidad Bancaria</div>
                        <div className="font-bold text-white text-sm mt-0.5">{selectedSupplier.bankName || 'Bancolombia'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Tipo de Cuenta</div>
                        <div className="font-bold text-white text-sm mt-0.5">{selectedSupplier.bankAccountType || 'CORRIENTE'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[11px]">Número de Cuenta</div>
                        <div className="font-bold text-teal-400 text-sm mt-0.5">
                          {selectedSupplier.bankAccountNumber || 'No registrada'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs pt-2 border-t border-slate-800/80 text-slate-400 font-mono">
                      <span className="text-slate-200 font-semibold">Titular Certificado:</span> {selectedSupplier.bankAccountHolder || selectedSupplier.legalName || selectedSupplier.name}
                    </div>
                  </div>

                  {/* Estado de Cuenta Corriente */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono font-bold text-teal-400 uppercase flex items-center gap-1.5">
                      <Receipt size={15} /> BALANCE DE CUENTA CORRIENTE & CARTERA VIVA
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Saldo Pendiente de Giro</div>
                        <div className="text-lg font-bold text-white font-mono mt-0.5">
                          ${(selectedSupplier.accountBalance?.currentBalance || 0).toLocaleString('es-CO')} {selectedSupplier.currency}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Facturas por Vencer</div>
                        <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                          {selectedSupplier.accountBalance?.pendingInvoices || 0} facturas
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Último Desembolso</div>
                        <div className="text-xs font-semibold text-slate-300 mt-2">
                          {selectedSupplier.accountBalance?.lastPaymentDate || 'Sin desembolsos recientes'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB CONTENT 3: INCOTERMS 2020 & PENALIZACIONES ────────────── */}
              {activeTabDossier === 'LOGISTICS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Incoterm Aplicable Detallado */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="text-xs font-mono font-bold text-teal-400 uppercase flex items-center gap-1.5">
                        <Globe2 size={15} /> TÉRMINO INCOTERMS 2020 APLICABLE
                      </div>
                      {(() => {
                        const inc = ALL_INCOTERMS.find(i => i.code === selectedSupplier.incoterm) || ALL_INCOTERMS[6];
                        return (
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/30">
                                {inc.code}
                              </span>
                              <div>
                                <div className="font-bold text-white text-sm">{inc.name}</div>
                                <div className="text-[11px] text-slate-400">{inc.mode}</div>
                              </div>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-slate-800">
                              {inc.desc}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Términos de Entrega & Lead Time */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="text-xs font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
                        <Truck size={15} /> CONDICIONES DE DESPACHO & TRANSPORTE
                      </div>
                      <div className="text-xs font-mono space-y-2 text-slate-300">
                        <div>
                          <span className="text-slate-500">Método de Transporte:</span>{' '}
                          <span className="font-bold text-white">
                            {selectedSupplier.deliveryTerms?.shippingMethod || 'TERRESTRE'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Lead Time (Tiempo de Entrega):</span>{' '}
                          <span className="font-bold text-teal-400">
                            {selectedSupplier.deliveryTerms?.leadTimeDays || 4} días calendario
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Punto de Entrega / Origen:</span>{' '}
                          <span className="text-white">
                            {selectedSupplier.deliveryTerms?.pickupAddress || selectedSupplier.city || 'Planta Principal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cláusula de Penalización por Retraso */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                      <Scale size={15} /> CLÁUSULA CONTRACTUAL DE PENALIZACIONES POR RETRASO
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Penalización Diaria</div>
                        <div className="text-lg font-bold text-rose-400 mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.penaltyPctPerDay || 0.5}% / día
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Tope Máximo de Penalización</div>
                        <div className="text-lg font-bold text-rose-400 mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.maxPenaltyPct || 10}%
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400">Período de Gracia</div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.gracePeriodDays || 2} días hábiles
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB CONTENT 4: CONTACTOS DEPARTAMENTALES ─────────────────── */}
              {activeTabDossier === 'CONTACTS' && (
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-teal-400 uppercase flex items-center gap-1.5">
                    <Users2 size={15} /> MATRIZ DE ESCALAMIENTO POR DEPARTAMENTO
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedSupplier.departmentContacts && selectedSupplier.departmentContacts.length > 0 ? (
                      selectedSupplier.departmentContacts.map((contact, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 uppercase border border-teal-500/20">
                              {contact.department}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white tracking-tight">{contact.contactName}</div>
                          <div className="text-[11px] text-slate-400 space-y-1">
                            <div>✉️ {contact.email}</div>
                            <div>📞 {contact.phone}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 p-8 text-center text-xs text-slate-500 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl font-mono">
                        No hay contactos departamentales tipificados para este proveedor.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB CONTENT 5: EXPEDIENTE DOCUMENTAL & DIAN ─────────────── */}
              {activeTabDossier === 'DOCS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                      EXPEDIENTE TRIBUTARIO, CAMERAL & CALIDAD
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedSupplier.documents?.length || 0} archivos auditados
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedSupplier.documents && selectedSupplier.documents.length > 0 ? (
                      selectedSupplier.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/40 transition font-mono"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                              <FileText size={17} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                {doc.title}
                                <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300">
                                  {doc.documentType}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {doc.expiryDate ? `Vence: ${doc.expiryDate.split('T')[0]}` : 'Vigencia Indefinida'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {doc.isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/20">
                                <CheckCircle2 size={12} /> Verificado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-500/20">
                                <Clock size={12} /> En Revisión
                              </span>
                            )}
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition border border-slate-800"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl font-mono">
                        Expediente sin archivos adjuntos. Haz clic en "ADJUNTAR DOC" para anexar RUT, Cámara de Comercio o Certificación Bancaria.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-500 font-mono text-xs">
              Selecciona un proveedor del directorio para inspeccionar su expediente completo.
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: ALTA INTEGRAL DE PROVEEDOR (ALL INCOTERMS & CURRENCIES) ─── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Alta de Proveedor Maestro & Comercio Exterior</h3>
                  <p className="text-xs text-slate-400 font-mono">Catálogo SRM: Parámetros tributarios, 11 Incoterms y multi-divisas</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterSupplier} className="space-y-6 text-xs font-mono">
              {/* Sección 1: Personería y Materia Prima */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Building2 size={14} /> 1. Identificación Comercial, Legal & Materia Prima
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Razón Social *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Importadora Café Andino SAS"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Nombre Comercial</label>
                    <input
                      type="text"
                      value={formData.commercialName}
                      onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                      placeholder="Andino Coffee Roasters"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Razón Social Legal (DIAN)</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      placeholder="Importadora Café Andino SAS"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Tipo Doc *</label>
                    <select
                      value={formData.taxType}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="NIT">NIT</option>
                      <option value="RUT">RUT</option>
                      <option value="CC">Cédula</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Número Tributario *</label>
                    <input
                      type="text"
                      required
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="900.123.456-7"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Categoría Operativa</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="RAW_MATERIALS">Materia Prima & Insumos</option>
                      <option value="PACKAGING">Empaques & Envases</option>
                      <option value="SERVICES">Servicios & Contratistas</option>
                      <option value="LOGISTICS">Transporte & Logística</option>
                      <option value="TECHNOLOGY">Tecnología & Software</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Ciudad Sede</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bogotá D.C."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Estado Inicial en SRM</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:border-teal-500"
                    >
                      {SUPPLIER_STATUSES.map(st => (
                        <option key={st.key} value={st.key}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Logotipo Corporativo</label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon size={16} className="text-slate-500" />
                        )}
                      </div>
                      <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/30 rounded-xl text-slate-300 cursor-pointer transition">
                        <Upload size={13} className="text-teal-400" />
                        <span>{isUploadingLogo ? 'Subiendo...' : formData.logoUrl ? 'Cambiar Imagen' : 'Subir Imagen/Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingLogo}
                          onChange={(e) => handleLogoUpload(e, false)}
                        />
                      </label>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: '' })}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20"
                          title="Quitar logo"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Materia Prima e Insumos Provistos (Separados por coma)</label>
                  <input
                    type="text"
                    value={formData.rawMaterialsScope}
                    onChange={(e) => setFormData({ ...formData, rawMaterialsScope: e.target.value })}
                    placeholder="Café Geisha, Miel de Bosque, Vasos 8oz, Válvulas Kraft"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Sección 2: Divisas, Bancos & Condiciones Comerciales */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <CreditCard size={14} /> 2. Divisa Operativa (ISO 4217), Finanzas & Dispersión Bancaria
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Divisa Operativa (Universal) *</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 font-bold focus:border-teal-500"
                    >
                      {ALL_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Plazo Pago (Días)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.paymentTermsDays}
                      onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Cupo Crédito Asignado</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Descuento Pronto Pago (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.discountRatePct}
                      onChange={(e) => setFormData({ ...formData, discountRatePct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Régimen Especial DIAN</label>
                    <select
                      value={formData.specialTaxRegime}
                      onChange={(e) => setFormData({ ...formData, specialTaxRegime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="REGIMEN_ORDINARIO">Régimen Ordinario</option>
                      <option value="SIMPLE">Régimen Simple de Trib.</option>
                      <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
                      <option value="AUTORRETENEDOR">Autorretenedor</option>
                      <option value="ESPECIAL_ESAL">Régimen Especial (ESAL)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Banco Oficial</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bancolombia, Citi, Chase..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Tipo Cuenta</label>
                    <select
                      value={formData.bankAccountType}
                      onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="CORRIENTE">Corriente</option>
                      <option value="AHORROS">Ahorros</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Número de Cuenta</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="123-456789-00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Los 11 Términos Incoterms 2020 & Logística */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Globe2 size={14} /> 3. Términos Incoterms 2020 (Todos los 11 Códigos) & Penalizaciones
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-bold">Incoterm Negociado (Regla CCI 2020) *</label>
                    <select
                      value={formData.incoterm}
                      onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-300 font-bold focus:border-teal-500"
                    >
                      {ALL_INCOTERMS.map(i => (
                        <option key={i.code} value={i.code}>
                          {i.code} - {i.name} ({i.mode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Método Envío</label>
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="TERRESTRE">Terrestre / Camión</option>
                      <option value="AEREO">Aéreo Expreso</option>
                      <option value="MARITIMO">Marítimo</option>
                      <option value="MULTIMODAL">Multimodal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Lead Time (Días)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Penalización Diaria Retraso (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.penaltyPctPerDay}
                      onChange={(e) => setFormData({ ...formData, penaltyPctPerDay: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Tope Máximo Penalización (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxPenaltyPct}
                      onChange={(e) => setFormData({ ...formData, maxPenaltyPct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Período de Gracia (Días)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.gracePeriodDays}
                      onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Canales Directos y Departamentales */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Users2 size={14} /> 4. Contactos por Departamento (Ventas, Cartera, Despachos)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Correo General Pedidos</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="pedidos@proveedor.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Teléfono Fijo / PBX</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+57 601 234 5678"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Celular / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                      placeholder="+57 310 987 6543"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold transition border border-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black transition flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(20,184,166,0.6)]"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  GUARDAR & REGISTRAR EN SRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADJUNTAR DOCUMENTO LEGAL ──────────────────────────────────── */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Adjuntar Documento Legal</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {selectedSupplier?.commercialName || selectedSupplier?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAttachDocument} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Tipo de Documento *</label>
                <select
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                >
                  <option value="RUT">RUT (Registro Único Tributario DIAN)</option>
                  <option value="CAMARA_COMERCIO">Cámara de Comercio (Existencia y Rep. Legal)</option>
                  <option value="CERTIFICACION_BANCARIA">Certificación Bancaria Oficial</option>
                  <option value="ISO_9001">Certificación ISO 9001 / Calidad</option>
                  <option value="SARLAFT">Declaración Origen de Fondos / SARLAFT</option>
                  <option value="ACUERDO_INCOTERMS">Contrato Marco Incoterms 2020</option>
                  <option value="ACUERDO_CONFIDENCIALIDAD">Acuerdo de Confidencialidad / NDA</option>
                  <option value="OTRO">Otro Documento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Título / Identificador *</label>
                <input
                  type="text"
                  required
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="Ej: RUT Vigente 2026 Descargado"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">URL / Enlace del Archivo *</label>
                <input
                  type="url"
                  required
                  value={docFormData.fileUrl}
                  onChange={(e) => setDocFormData({ ...docFormData, fileUrl: e.target.value })}
                  placeholder="https://storage.agency.com/doc-rut.pdf"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Fecha de Vencimiento (Si aplica)</label>
                <input
                  type="date"
                  value={docFormData.expiryDate}
                  onChange={(e) => setDocFormData({ ...docFormData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black transition flex items-center gap-2 shadow-md"
                >
                  {isSubmitting && <RefreshCw size={13} className="animate-spin" />}
                  CERTIFICAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
