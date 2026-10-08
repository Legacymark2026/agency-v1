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
  Edit3
} from 'lucide-react';

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
  department: string; // VENTAS, CARTERA, LOGISTICA, TECNICO, GERENCIA
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
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
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
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Modales
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [activeTabDossier, setActiveTabDossier] = useState<'GENERAL' | 'FINANCIAL' | 'LOGISTICS' | 'CONTACTS' | 'DOCS'>('GENERAL');

  // Form State Completo para Alta y Edición
  const [formData, setFormData] = useState({
    name: '',
    commercialName: '',
    legalName: '',
    taxId: '',
    taxType: 'NIT',
    category: 'RAW_MATERIALS',
    rawMaterialsScope: 'Café Grano Verde, Miel Pura, Empaques Kraft, Válvulas Desgasificadoras',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    mobilePhone: '',
    address: '',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    currency: 'COP',
    paymentTermsDays: 30,
    creditLimit: 15000000,
    discountRatePct: 2.5,
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
        alert('✅ Proveedor maestro y condiciones comerciales registradas exitosamente.');
      } else {
        alert(data.error || 'Error al guardar proveedor.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const compliantCount = suppliers.filter(s => s.compliance?.compliant).length;
  const underReviewCount = suppliers.filter(s => s.status === 'UNDER_REVIEW').length;
  const totalCreditCOP = suppliers
    .filter(s => s.currency === 'COP')
    .reduce((acc, s) => acc + (s.creditLimit || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header & KPI Banner ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                Gestión Integral de Proveedores & SRM
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  RBAC Protegido
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Homologación comercial, acuerdos Incoterms, régimen tributario, datos bancarios y fiscalización documental.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuppliers}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition border border-border"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sincronizar
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-lg shadow-teal-950/20"
          >
            <Plus size={15} /> Alta de Proveedor
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Homologados</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{suppliers.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Proveedores en el Catálogo</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumplimiento Legal</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {suppliers.length > 0 ? Math.round((compliantCount / suppliers.length) * 100) : 100}%
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">{compliantCount} con RUT y Certificación al día</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">En Revisión</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{underReviewCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">Pendiente homologación comercial</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Línea de Crédito COP</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-2 font-mono">
            ${(totalCreditCOP / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-blue-400/80 mt-0.5">Cupo rotativo negociado</div>
        </div>
      </div>

      {/* ── Main Workspace: Directory & Detail Split View ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Suppliers Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-teal-400" />
                Directorio ({filteredSuppliers.length})
              </h2>
              <span className="text-[11px] text-muted-foreground">Filtro Rápido</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Razón Social, Nombre, NIT o Ciudad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="RAW_MATERIALS">Materia Prima & Insumos</option>
                <option value="PACKAGING">Empaques & Envases</option>
                <option value="SERVICES">Servicios & Contratistas</option>
                <option value="LOGISTICS">Transporte & Logística</option>
                <option value="TECHNOLOGY">Tecnología & Licencias</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="UNDER_REVIEW">En Revisión</option>
                <option value="SUSPENDED">Suspendidos</option>
              </select>
            </div>
          </div>

          {/* Suppliers List */}
          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-400" />
                Cargando directorio de proveedores...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                No se encontraron proveedores que coincidan con la búsqueda.
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                const isSelected = selectedSupplier?.id === supplier.id;
                const isCompliant = supplier.compliance?.compliant;

                return (
                  <div
                    key={supplier.id}
                    onClick={() => setSelectedSupplier(supplier)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                        : 'bg-card border-border hover:border-teal-500/30 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {supplier.commercialName || supplier.name}
                          </h3>
                          {supplier.ratingScore && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                              <Star size={10} className="fill-amber-400" /> {supplier.ratingScore.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                          <span>{supplier.taxType}: {supplier.taxId}</span>
                          <span>•</span>
                          <span className="text-[11px]">{supplier.city || 'Colombia'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          supplier.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {supplier.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold">
                          {supplier.incoterm || 'DDP'}
                        </span>
                        <span>Plazo: {supplier.paymentTermsDays}d</span>
                        <span className="font-mono text-[11px] text-teal-400 font-bold">{supplier.currency}</span>
                      </div>

                      <div>
                        {isCompliant ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 size={13} /> Certificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                            <AlertTriangle size={13} /> {supplier.compliance?.missingMandatoryDocs.length} docs
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

        {/* Right Column: Detailed Supplier Dossier */}
        <div className="lg:col-span-7">
          {selectedSupplier ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-foreground">
                      {selectedSupplier.commercialName || selectedSupplier.name}
                    </h2>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-lg border border-border font-bold">
                      {selectedSupplier.taxType}: {selectedSupplier.taxId}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">Razón Social Legal:</span> {selectedSupplier.legalName || selectedSupplier.name}
                    <span>•</span>
                    <span>{selectedSupplier.city}, {selectedSupplier.country}</span>
                    <span>•</span>
                    <span className="text-teal-400 font-bold">Divisa Operativa: {selectedSupplier.currency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-sm"
                  >
                    <Upload size={14} /> Adjuntar Documento
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

              {/* Navigation Tabs inside Dossier */}
              <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTabDossier('GENERAL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTabDossier === 'GENERAL' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  General & Materia Prima
                </button>
                <button
                  onClick={() => setActiveTabDossier('FINANCIAL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTabDossier === 'FINANCIAL' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Financiero, Bancario & Fiscal
                </button>
                <button
                  onClick={() => setActiveTabDossier('LOGISTICS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTabDossier === 'LOGISTICS' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Logística & Incoterms
                </button>
                <button
                  onClick={() => setActiveTabDossier('CONTACTS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTabDossier === 'CONTACTS' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Contactos por Departamento
                </button>
                <button
                  onClick={() => setActiveTabDossier('DOCS')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    activeTabDossier === 'DOCS' ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Expediente Documental ({selectedSupplier.documents?.length || 0})
                </button>
              </div>

              {/* TAB CONTENT: GENERAL & MATERIA PRIMA */}
              {activeTabDossier === 'GENERAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Building2 size={14} className="text-teal-400" /> Identificación Tributaria & Legal
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div><span className="text-muted-foreground">Razón Social:</span> <span className="font-bold text-foreground">{selectedSupplier.name}</span></div>
                        <div><span className="text-muted-foreground">Nombre Comercial:</span> <span className="font-semibold text-foreground">{selectedSupplier.commercialName || selectedSupplier.name}</span></div>
                        <div><span className="text-muted-foreground">Razón Social Legal (DIAN):</span> <span className="font-semibold text-foreground">{selectedSupplier.legalName || selectedSupplier.name}</span></div>
                        <div><span className="text-muted-foreground">Tipo & Documento:</span> <span className="font-mono font-bold text-teal-400">{selectedSupplier.taxType} {selectedSupplier.taxId}</span></div>
                        <div><span className="text-muted-foreground">Ciudad Sede & País:</span> <span className="font-semibold text-foreground">{selectedSupplier.city || 'Bogotá'}, {selectedSupplier.country}</span></div>
                        <div><span className="text-muted-foreground">Dirección Física:</span> <span className="font-semibold text-foreground">{selectedSupplier.address || 'No registrada'}</span></div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Package size={14} className="text-amber-400" /> Materia Prima e Insumos Provistos
                      </div>
                      <div className="text-xs text-muted-foreground">Línea de abastecimiento e ítems homologados:</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSupplier.rawMaterialsScope && selectedSupplier.rawMaterialsScope.length > 0 ? (
                          selectedSupplier.rawMaterialsScope.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/20">
                              📦 {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No se han tipificado insumos específicos para este proveedor.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-2xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-teal-400" />
                      <div>
                        <div className="font-bold text-foreground">Teléfono Principal y Celular Directo</div>
                        <div className="text-muted-foreground">
                          Tel: {selectedSupplier.contactPhone || 'N/A'} • Celular / WhatsApp: {selectedSupplier.mobilePhone || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-teal-400" />
                      <div>
                        <div className="font-bold text-foreground">Correo de Enlace de Pedidos</div>
                        <div className="text-muted-foreground">{selectedSupplier.contactEmail || 'No asignado'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: FINANCIERO, BANCARIO & FISCAL */}
              {activeTabDossier === 'FINANCIAL' && (
                <div className="space-y-4">
                  {/* Grid Financiero */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-muted/50 rounded-xl border border-border">
                      <div className="text-[11px] text-muted-foreground">Plazo de Pago</div>
                      <div className="text-base font-black text-foreground mt-0.5">
                        {selectedSupplier.paymentTermsDays} días
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Facturas netas</div>
                    </div>

                    <div className="p-3.5 bg-muted/50 rounded-xl border border-border">
                      <div className="text-[11px] text-muted-foreground">Cupo de Crédito</div>
                      <div className="text-base font-black text-foreground font-mono mt-0.5">
                        ${selectedSupplier.creditLimit.toLocaleString('es-CO')}
                      </div>
                      <div className="text-[10px] text-teal-400 mt-0.5">Divisa: {selectedSupplier.currency}</div>
                    </div>

                    <div className="p-3.5 bg-muted/50 rounded-xl border border-border">
                      <div className="text-[11px] text-muted-foreground">Descuento Negociado</div>
                      <div className="text-base font-black text-teal-400 font-mono mt-0.5">
                        {selectedSupplier.discountRatePct}%
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Pronto pago / comercial</div>
                    </div>

                    <div className="p-3.5 bg-muted/50 rounded-xl border border-border">
                      <div className="text-[11px] text-muted-foreground">Régimen Especial</div>
                      <div className="text-xs font-bold text-amber-400 mt-1 truncate">
                        {selectedSupplier.specialTaxRegime || 'REGIMEN_ORDINARIO'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Clasificación DIAN</div>
                    </div>
                  </div>

                  {/* Datos Bancarios Oficiales */}
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <CreditCard size={15} className="text-blue-400" /> Datos Bancarios para Transferencias Oficiales
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-muted-foreground text-[11px]">Entidad Financiera</div>
                        <div className="font-bold text-foreground text-sm">{selectedSupplier.bankName || 'Bancolombia'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[11px]">Tipo de Cuenta</div>
                        <div className="font-bold text-foreground text-sm">{selectedSupplier.bankAccountType || 'CORRIENTE'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-[11px]">Número de Cuenta</div>
                        <div className="font-mono font-bold text-blue-400 text-sm">
                          {selectedSupplier.bankAccountNumber || 'No registrada'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs pt-1 border-t border-border/50 text-muted-foreground">
                      <span className="font-semibold text-foreground">Titular Registrado:</span> {selectedSupplier.bankAccountHolder || selectedSupplier.legalName || selectedSupplier.name}
                    </div>
                  </div>

                  {/* Estado de Cuenta Corriente */}
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2">
                    <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Receipt size={15} className="text-teal-400" /> Estado de Cuenta Corriente (Balance en Vivo)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Saldo Pendiente de Pago</div>
                        <div className="text-base font-bold text-foreground font-mono mt-0.5">
                          ${(selectedSupplier.accountBalance?.currentBalance || 0).toLocaleString('es-CO')} {selectedSupplier.currency}
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Facturas por Vencer</div>
                        <div className="text-base font-bold text-foreground font-mono mt-0.5">
                          {selectedSupplier.accountBalance?.pendingInvoices || 0} facturas
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Último Pago Emitido</div>
                        <div className="text-sm font-semibold text-muted-foreground mt-1">
                          {selectedSupplier.accountBalance?.lastPaymentDate || 'Sin movimientos recientes'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: LOGISTICA & INCOTERMS */}
              {activeTabDossier === 'LOGISTICS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Términos de Entrega & Envío */}
                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
                      <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Truck size={15} className="text-blue-400" /> Términos de Entrega & Método de Envío
                      </div>
                      <div className="text-xs space-y-2">
                        <div>
                          <span className="text-muted-foreground">Método de Transporte:</span>{' '}
                          <span className="font-bold text-foreground">
                            {selectedSupplier.deliveryTerms?.shippingMethod || 'TERRESTRE'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lead Time (Tiempo de Entrega):</span>{' '}
                          <span className="font-bold text-teal-400">
                            {selectedSupplier.deliveryTerms?.leadTimeDays || 3} días hábiles
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lugar de Despacho / Origen:</span>{' '}
                          <span className="font-semibold text-foreground">
                            {selectedSupplier.deliveryTerms?.pickupAddress || selectedSupplier.city || 'Planta Principal'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Incoterms Aplicables */}
                    <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
                      <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Globe2 size={15} className="text-teal-400" /> Incoterms 2020 Aplicables
                      </div>
                      <div className="text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-teal-400 font-mono bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20">
                            {selectedSupplier.incoterm || 'DDP'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {selectedSupplier.incoterm === 'DDP' ? 'Delivered Duty Paid (Puesto en Bodega Comprador)' : 'Término de Entrega Internacional Negociado'}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground pt-1">
                          Responsabilidad del flete, seguros e impuestos de aduana delimitados contractualmente.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Penalizaciones por Retraso */}
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Scale size={15} className="text-rose-400" /> Cláusula de Penalizaciones por Retraso en Despacho
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Penalización Diaria</div>
                        <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.penaltyPctPerDay || 0.5}% / día
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Tope Máximo de Penalización</div>
                        <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.maxPenaltyPct || 10}%
                        </div>
                      </div>
                      <div className="p-3 bg-card rounded-xl border border-border">
                        <div className="text-[11px] text-muted-foreground">Período de Gracia</div>
                        <div className="text-base font-bold text-foreground font-mono mt-0.5">
                          {selectedSupplier.delayPenaltyPolicy?.gracePeriodDays || 2} días
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CONTACTOS POR DEPARTAMENTO */}
              {activeTabDossier === 'CONTACTS' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Users2 size={15} className="text-teal-400" /> Contactos Específicos por Departamento
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedSupplier.departmentContacts && selectedSupplier.departmentContacts.length > 0 ? (
                      selectedSupplier.departmentContacts.map((contact, idx) => (
                        <div key={idx} className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 uppercase">
                              {contact.department}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-foreground">{contact.contactName}</div>
                          <div className="text-[11px] text-muted-foreground space-y-0.5">
                            <div>✉️ {contact.email}</div>
                            <div>📞 {contact.phone}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-2xl">
                        No hay contactos departamentales registrados para este proveedor.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: EXPEDIENTE DOCUMENTAL */}
              {activeTabDossier === 'DOCS' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Expediente Documental Legal, Tributario & Calidad
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedSupplier.documents?.length || 0} archivos auditados
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedSupplier.documents && selectedSupplier.documents.length > 0 ? (
                      selectedSupplier.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border hover:border-teal-500/30 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                              <FileText size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                                {doc.title}
                                <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded font-mono text-muted-foreground">
                                  {doc.documentType}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {doc.expiryDate ? `Vence: ${doc.expiryDate.split('T')[0]}` : 'Sin fecha de vencimiento'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/20">
                                <CheckCircle2 size={11} /> Verificado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-500/20">
                                <Clock size={11} /> Pendiente
                              </span>
                            )}
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                        Este proveedor no cuenta aún con documentos anexos. Haz clic en "Adjuntar Documento" para cargar RUT, Cámara de Comercio o Certificación Bancaria.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              Selecciona un proveedor del directorio para inspeccionar su expediente completo.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Registrar Proveedor Maestro con Todos los Parámetros ──────── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alta Maestra de Proveedor & Parámetros SRM</h3>
                  <p className="text-xs text-slate-400">Registro integral comercial, legal, fiscal, logístico y bancario</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSupplier} className="space-y-6 text-xs">
              {/* Sección 1: Identificación y Materia Prima */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Building2 size={14} /> 1. Identificación Comercial, Legal & Materia Prima
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Razón Social *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Distribuidora Los Andes SAS"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Nombre Comercial</label>
                    <input
                      type="text"
                      value={formData.commercialName}
                      onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
                      placeholder="Los Andes Café"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Razón Social Legal (DIAN)</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      placeholder="Distribuidora Los Andes SAS"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Tipo Doc *</label>
                    <select
                      value={formData.taxType}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="NIT">NIT</option>
                      <option value="RUT">RUT</option>
                      <option value="CC">Cédula</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Número Tributario *</label>
                    <input
                      type="text"
                      required
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="900.123.456-7"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Categoría Operativa</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="RAW_MATERIALS">Materia Prima & Insumos</option>
                      <option value="PACKAGING">Empaques & Envases</option>
                      <option value="SERVICES">Servicios & Tercerización</option>
                      <option value="LOGISTICS">Transporte & Logística</option>
                      <option value="TECHNOLOGY">Tecnología & Licencias</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Ciudad Sede</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bogotá D.C."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Materia Prima e Insumos Provistos (Separados por coma)</label>
                  <input
                    type="text"
                    value={formData.rawMaterialsScope}
                    onChange={(e) => setFormData({ ...formData, rawMaterialsScope: e.target.value })}
                    placeholder="Café Geisha, Miel de Bosque, Vasos 8oz, Válvulas Kraft"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Sección 2: Financiero, Divisas, Plazos & Bancario */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <CreditCard size={14} /> 2. Condiciones Comerciales, Financieras & Bancarias
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Plazo Pago (Días)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.paymentTermsDays}
                      onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Cupo Crédito ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Descuento (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.discountRatePct}
                      onChange={(e) => setFormData({ ...formData, discountRatePct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Divisa Operativa</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 font-bold font-mono"
                    >
                      <option value="COP">COP ($ Peso Colombiano)</option>
                      <option value="USD">USD ($ Dólar Americano)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Régimen Especial DIAN</label>
                    <select
                      value={formData.specialTaxRegime}
                      onChange={(e) => setFormData({ ...formData, specialTaxRegime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="REGIMEN_ORDINARIO">Régimen Ordinario</option>
                      <option value="SIMPLE">Régimen Simple de Trib.</option>
                      <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
                      <option value="AUTORRETENEDOR">Autorretenedor</option>
                      <option value="ESPECIAL_ESAL">Régimen Tributario Especial (ESAL)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Banco para Transferencias</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bancolombia, Davivienda..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Tipo de Cuenta</label>
                    <select
                      value={formData.bankAccountType}
                      onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="CORRIENTE">Corriente</option>
                      <option value="AHORROS">Ahorros</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Número de Cuenta Bancaria</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      placeholder="123-456789-00"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Logística, Incoterms & Penalizaciones */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Truck size={14} /> 3. Términos de Entrega, Incoterms & Penalizaciones
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Método de Envío</label>
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    >
                      <option value="TERRESTRE">Terrestre / Camión</option>
                      <option value="AEREO">Aéreo Expreso</option>
                      <option value="MARITIMO">Marítimo</option>
                      <option value="MULTIMODAL">Multimodal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Incoterm Negociado</label>
                    <select
                      value={formData.incoterm}
                      onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 font-mono font-bold"
                    >
                      <option value="DDP">DDP (Puesto en Bodega)</option>
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="EXW">EXW (En Fábrica Proveedor)</option>
                      <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                      <option value="FCA">FCA (Free Carrier)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Lead Time (Días)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Penalización Diaria (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.penaltyPctPerDay}
                      onChange={(e) => setFormData({ ...formData, penaltyPctPerDay: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Contactos Clave */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Users2 size={14} /> 4. Canales de Contacto Directo & Departamentos
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Correo Electrónico de Pedidos</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="pedidos@proveedor.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Teléfono Fijo</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+57 601 234 5678"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Celular / WhatsApp Comercial</label>
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                      placeholder="+57 310 987 6543"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Contactos por Área */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-teal-400">Contacto Ventas</div>
                    <input
                      type="text"
                      placeholder="Nombre del Asesor"
                      value={formData.contactSalesName}
                      onChange={(e) => setFormData({ ...formData, contactSalesName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                    <input
                      type="email"
                      placeholder="Correo Asesor"
                      value={formData.contactSalesEmail}
                      onChange={(e) => setFormData({ ...formData, contactSalesEmail: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-teal-400">Contacto Cartera / Facturación</div>
                    <input
                      type="text"
                      placeholder="Nombre Cartera"
                      value={formData.contactBillingName}
                      onChange={(e) => setFormData({ ...formData, contactBillingName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                    <input
                      type="email"
                      placeholder="Correo Cartera"
                      value={formData.contactBillingEmail}
                      onChange={(e) => setFormData({ ...formData, contactBillingEmail: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-teal-400">Contacto Despachos / Logística</div>
                    <input
                      type="text"
                      placeholder="Nombre Despachos"
                      value={formData.contactLogisticsName}
                      onChange={(e) => setFormData({ ...formData, contactLogisticsName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                    <input
                      type="email"
                      placeholder="Correo Despachos"
                      value={formData.contactLogisticsEmail}
                      onChange={(e) => setFormData({ ...formData, contactLogisticsEmail: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-teal-950/30"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Certificar y Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Adjuntar Documento ───────────────────────────────────────── */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Adjuntar Documento Legal</h3>
                  <p className="text-xs text-slate-400">{selectedSupplier?.commercialName || selectedSupplier?.name}</p>
                </div>
              </div>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAttachDocument} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Tipo de Documento *</label>
                <select
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                >
                  <option value="RUT">RUT (Registro Único Tributario DIAN)</option>
                  <option value="CAMARA_COMERCIO">Cámara de Comercio (Existencia y Rep. Legal)</option>
                  <option value="CERTIFICACION_BANCARIA">Certificación Bancaria Oficial</option>
                  <option value="ISO_9001">Certificación ISO 9001 / Calidad</option>
                  <option value="SARLAFT">Declaración Origen de Fondos / SARLAFT</option>
                  <option value="ACUERDO_CONFIDENCIALIDAD">Acuerdo de Confidencialidad / NDA</option>
                  <option value="ACUERDO_INCOTERMS">Contrato Marco de Suministro & Incoterms</option>
                  <option value="OTRO">Otro Documento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Título / Descripción *</label>
                <input
                  type="text"
                  required
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="Ej: RUT Actualizado 2026 Descargado"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">URL o Enlace del Archivo *</label>
                <input
                  type="url"
                  required
                  value={docFormData.fileUrl}
                  onChange={(e) => setDocFormData({ ...docFormData, fileUrl: e.target.value })}
                  placeholder="https://storage.agency.com/doc-rut.pdf"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Fecha de Vencimiento (Si aplica)</label>
                <input
                  type="date"
                  value={docFormData.expiryDate}
                  onChange={(e) => setDocFormData({ ...docFormData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Certificar y Adjuntar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
