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
  SlidersHorizontal
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

interface SupplierItem {
  id: string;
  name: string;
  legalName?: string | null;
  taxId: string;
  taxType: string;
  category: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  city?: string | null;
  country: string;
  paymentTermsDays: number;
  creditLimit: number;
  currency: string;
  discountRatePct: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
  ratingScore: number;
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
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form states for new supplier
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    taxType: 'NIT',
    category: 'RAW_MATERIALS',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    paymentTermsDays: 30,
    creditLimit: 10000000,
    currency: 'COP',
    discountRatePct: 0,
    bankName: 'Bancolombia',
    bankAccountType: 'CORRIENTE',
    bankAccountNumber: '',
    bankAccountHolder: '',
    notes: '',
  });

  // Form state for new document
  const [docFormData, setDocFormData] = useState({
    documentType: 'RUT',
    title: '',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  });

  // Carga inicial desde PostgreSQL
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        if (data.suppliers) {
          setSuppliers(data.suppliers);
          if (data.suppliers.length > 0 && !selectedSupplier) {
            setSelectedSupplier(data.suppliers[0]);
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
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.supplier) {
        setSuppliers([data.supplier, ...suppliers]);
        setSelectedSupplier(data.supplier);
        setIsRegisterModalOpen(false);
        setFormData({
          name: '',
          legalName: '',
          taxId: '',
          taxType: 'NIT',
          category: 'RAW_MATERIALS',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          city: 'Bogotá D.C.',
          country: 'Colombia',
          paymentTermsDays: 30,
          creditLimit: 10000000,
          currency: 'COP',
          discountRatePct: 0,
          bankName: 'Bancolombia',
          bankAccountType: 'CORRIENTE',
          bankAccountNumber: '',
          bankAccountHolder: '',
          notes: '',
        });
        alert('✅ Proveedor registrado exitosamente en el catálogo maestro.');
      } else {
        alert(data.error || 'Error al crear el proveedor.');
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
        const updatedSupplier = {
          ...selectedSupplier,
          documents: updatedDocs,
        };
        setSelectedSupplier(updatedSupplier);
        setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
        setIsDocModalOpen(false);
        setDocFormData({ documentType: 'RUT', title: '', fileUrl: '', expiryDate: '', notes: '' });
        alert('✅ Documento adjuntado y certificado exitosamente.');
      } else {
        alert(data.error || 'Error al adjuntar documento.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.taxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactEmail && s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const compliantCount = suppliers.filter(s => s.compliance?.compliant).length;
  const underReviewCount = suppliers.filter(s => s.status === 'UNDER_REVIEW').length;
  const totalCredit = suppliers.reduce((acc, s) => acc + (s.creditLimit || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header & KPI Banner ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Gestión Maestra de Proveedores</h1>
              <p className="text-xs text-muted-foreground">
                SRM & Procurement: Homologación tributaria, control de cumplimiento documental y acuerdos de crédito.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuppliers}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition border border-border"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refrescar
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-lg shadow-teal-950/20"
          >
            <Plus size={15} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Proveedores</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">{suppliers.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Homologados en sistema</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cumplimiento Legal</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {suppliers.length > 0 ? Math.round((compliantCount / suppliers.length) * 100) : 100}%
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">{compliantCount} de {suppliers.length} 100% al día</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">En Revisión / Pendiente</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{underReviewCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">Falta validar RUT o Cámara</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Línea de Crédito Global</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground mt-2 font-mono">
            ${(totalCredit / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-blue-400/80 mt-0.5">Cupo rotativo disponible</div>
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
              <span className="text-[11px] text-muted-foreground">Catálogo Maestro</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por Nombre, NIT o Correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted/60 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground focus:outline-none"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="RAW_MATERIALS">Materia Prima / Insumos</option>
                <option value="SERVICES">Servicios & Tercerización</option>
                <option value="LOGISTICS">Transporte & Logística</option>
                <option value="TECHNOLOGY">Tecnología & Software</option>
                <option value="GENERAL">General / Papelería</option>
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
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-teal-400" />
                Cargando directorio de proveedores...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl">
                No se encontraron proveedores con los filtros aplicados.
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
                          <h3 className="text-sm font-bold text-foreground">{supplier.name}</h3>
                          {supplier.ratingScore && (
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                              <Star size={10} className="fill-amber-400" /> {supplier.ratingScore.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {supplier.taxType}: {supplier.taxId}
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
                          {supplier.category}
                        </span>
                        <span>Plazo: {supplier.paymentTermsDays} días</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isCompliant ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                            <CheckCircle2 size={13} /> Al día
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                            <AlertTriangle size={13} /> {supplier.compliance?.missingMandatoryDocs.length} docs pendientes
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
                    <h2 className="text-xl font-black text-foreground">{selectedSupplier.name}</h2>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-lg border border-border">
                      {selectedSupplier.taxType}: {selectedSupplier.taxId}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedSupplier.legalName || selectedSupplier.name} • {selectedSupplier.city || 'Colombia'}, {selectedSupplier.country}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition shadow-sm"
                  >
                    <Upload size={14} /> Adjuntar Documento
                  </button>
                </div>
              </div>

              {/* Commercial & Financial Conditions Grid */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Condiciones Comerciales & Financieras
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/50 rounded-xl border border-border">
                    <div className="text-[11px] text-muted-foreground">Plazo de Pago</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {selectedSupplier.paymentTermsDays} días netos
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl border border-border">
                    <div className="text-[11px] text-muted-foreground">Límite de Crédito</div>
                    <div className="text-sm font-bold text-foreground font-mono mt-0.5">
                      ${selectedSupplier.creditLimit.toLocaleString('es-CO')}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl border border-border">
                    <div className="text-[11px] text-muted-foreground">Descuento Comercial</div>
                    <div className="text-sm font-bold text-teal-400 font-mono mt-0.5">
                      {selectedSupplier.discountRatePct}%
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl border border-border">
                    <div className="text-[11px] text-muted-foreground">Calificación SRM</div>
                    <div className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <Star size={13} className="fill-amber-400" /> {selectedSupplier.ratingScore.toFixed(1)} / 5.0
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Información de Contacto & Representante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border">
                    <Phone size={14} className="text-teal-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Teléfono / WhatsApp</div>
                      <div className="font-semibold text-foreground">{selectedSupplier.contactPhone || 'No registrado'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border">
                    <Mail size={14} className="text-teal-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Correo Corporativo</div>
                      <div className="font-semibold text-foreground truncate">{selectedSupplier.contactEmail || 'No registrado'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-xl border border-border">
                    <MapPin size={14} className="text-teal-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Ubicación / Despachos</div>
                      <div className="font-semibold text-foreground">{selectedSupplier.city || 'Bogotá D.C.'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Regulatory Document Compliance Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Expediente Documental & SARLAFT
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedSupplier.documents?.length || 0} documentos registrados
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedSupplier.documents && selectedSupplier.documents.length > 0 ? (
                    selectedSupplier.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border hover:border-teal-500/30 transition"
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
                    <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                      Este proveedor no cuenta aún con documentos anexos. Haz clic en "Adjuntar Documento" para cargar RUT, Cámara de Comercio o Certificación Bancaria.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              Selecciona un proveedor del directorio para inspeccionar su expediente comercial y documental.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Registrar Proveedor Maestro ──────────────────────────────── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Alta de Proveedor Maestro</h3>
                  <p className="text-xs text-slate-400">Homologación y registro de condiciones comerciales</p>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Razón Social / Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Distribuidora Central SAS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Razón Social Legal (DIAN)</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="Ej: Distribuidora Central SAS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-300">Número de Identificación Tributaria *</label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="900.123.456-7"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Categoría Operativa</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  >
                    <option value="RAW_MATERIALS">Materia Prima / Insumos</option>
                    <option value="SERVICES">Servicios & Contratistas</option>
                    <option value="LOGISTICS">Transporte & Logística</option>
                    <option value="TECHNOLOGY">Tecnología & Licencias</option>
                    <option value="GENERAL">General / Suministros</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Ciudad de Sede</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bogotá D.C."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="font-bold text-slate-300">Cupo Crédito ($ COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Descuento (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountRatePct}
                    onChange={(e) => setFormData({ ...formData, discountRatePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Correo Electrónico de Pedidos</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="facturacion@proveedor.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Teléfono / Celular</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-teal-500"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  Guardar en Catálogo Maestro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Adjuntar Documento ───────────────────────────────────────── */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Adjuntar Documento Legal</h3>
                  <p className="text-xs text-slate-400">{selectedSupplier?.name}</p>
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
                  <option value="RUT">RUT (Registro Único Tributario)</option>
                  <option value="CAMARA_COMERCIO">Cámara de Comercio (Existencia y Rep. Legal)</option>
                  <option value="CERTIFICACION_BANCARIA">Certificación Bancaria Oficial</option>
                  <option value="ISO_9001">Certificado Calidad ISO 9001</option>
                  <option value="SARLAFT">Declaración Origen de Fondos / SARLAFT</option>
                  <option value="ACUERDO_CONFIDENCIALIDAD">Acuerdo Confidencialidad / NDA</option>
                  <option value="OTRO">Otro Documento</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Título / Descripción del Documento *</label>
                <input
                  type="text"
                  required
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="Ej: RUT Vigente 2026 Descargado"
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition flex items-center gap-2"
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
