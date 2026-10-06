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
  X
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

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([
    {
      id: 'sup-1',
      name: 'Distribuidora Andina de Café SAS',
      legalName: 'Distribuidora Andina de Café SAS',
      taxId: '900.845.123-1',
      taxType: 'NIT',
      category: 'RAW_MATERIALS',
      contactName: 'Carlos Gómez',
      contactEmail: 'cgomez@andinacafe.com',
      contactPhone: '+57 310 456 7890',
      city: 'Medellín',
      country: 'Colombia',
      paymentTermsDays: 45,
      creditLimit: 85000000,
      currency: 'COP',
      discountRatePct: 4.5,
      status: 'ACTIVE',
      ratingScore: 4.9,
      documents: [
        { id: 'doc-1', documentType: 'RUT', title: 'RUT Actualizado 2026', fileUrl: 'https://storage.agency.com/rut1.pdf', isVerified: true, status: 'ACTIVE' },
        { id: 'doc-2', documentType: 'CAMARA_COMERCIO', title: 'Certificado Existencia y Rep. Legal', fileUrl: 'https://storage.agency.com/cc1.pdf', isVerified: true, status: 'ACTIVE' },
        { id: 'doc-3', documentType: 'CERTIFICACION_BANCARIA', title: 'Certificación Bancaria Bancolombia', fileUrl: 'https://storage.agency.com/cb1.pdf', isVerified: true, status: 'ACTIVE' },
        { id: 'doc-4', documentType: 'ISO_9001', title: 'Certificación ISO 9001:2015 Calidad', fileUrl: 'https://storage.agency.com/iso1.pdf', isVerified: true, status: 'ACTIVE' },
      ],
      compliance: { compliant: true, missingMandatoryDocs: [], expiredDocs: [] }
    },
    {
      id: 'sup-2',
      name: 'Empaques Biodegradables del Valle',
      legalName: 'BioEmpaques del Valle Ltda',
      taxId: '890.304.567-8',
      taxType: 'NIT',
      category: 'RAW_MATERIALS',
      contactName: 'Marcela Rivera',
      contactEmail: 'mrivera@bioempaques.co',
      contactPhone: '+57 315 890 1234',
      city: 'Cali',
      country: 'Colombia',
      paymentTermsDays: 30,
      creditLimit: 30000000,
      currency: 'COP',
      discountRatePct: 2.0,
      status: 'UNDER_REVIEW',
      ratingScore: 4.2,
      documents: [
        { id: 'doc-5', documentType: 'RUT', title: 'RUT 2025', fileUrl: 'https://storage.agency.com/rut2.pdf', isVerified: false, status: 'ACTIVE' },
      ],
      compliance: { compliant: false, missingMandatoryDocs: ['CAMARA_COMERCIO', 'CERTIFICACION_BANCARIA'], expiredDocs: [] }
    },
    {
      id: 'sup-3',
      name: 'Logística de Carga Nacional SAS',
      legalName: 'Logística de Carga Nacional SAS',
      taxId: '901.222.333-4',
      taxType: 'NIT',
      category: 'LOGISTICS',
      contactName: 'Juan Pablo Restrepo',
      contactEmail: 'operaciones@logisticanacional.com',
      contactPhone: '+57 320 678 9012',
      city: 'Bogotá D.C.',
      country: 'Colombia',
      paymentTermsDays: 15,
      creditLimit: 45000000,
      currency: 'COP',
      discountRatePct: 0,
      status: 'ACTIVE',
      ratingScore: 4.7,
      documents: [
        { id: 'doc-6', documentType: 'RUT', title: 'RUT Vigente', fileUrl: 'https://storage.agency.com/rut3.pdf', isVerified: true, status: 'ACTIVE' },
        { id: 'doc-7', documentType: 'CAMARA_COMERCIO', title: 'Cámara de Comercio Bogotá', fileUrl: 'https://storage.agency.com/cc3.pdf', isVerified: true, status: 'ACTIVE' },
        { id: 'doc-8', documentType: 'CERTIFICACION_BANCARIA', title: 'Certificación Davivienda', fileUrl: 'https://storage.agency.com/cb3.pdf', isVerified: true, status: 'ACTIVE' },
      ],
      compliance: { compliant: true, missingMandatoryDocs: [], expiredDocs: [] }
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form states for new supplier
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    taxType: 'NIT',
    category: 'GENERAL',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
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
  });

  // Form state for new document
  const [docFormData, setDocFormData] = useState({
    documentType: 'RUT',
    title: '',
    fileUrl: '',
    expiryDate: '',
  });

  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupplier: SupplierItem = {
      id: `sup-${Date.now()}`,
      name: formData.name,
      legalName: formData.legalName || formData.name,
      taxId: formData.taxId,
      taxType: formData.taxType,
      category: formData.category,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      city: formData.city,
      country: formData.country,
      paymentTermsDays: Number(formData.paymentTermsDays),
      creditLimit: Number(formData.creditLimit),
      currency: formData.currency,
      discountRatePct: Number(formData.discountRatePct),
      status: 'ACTIVE',
      ratingScore: 5.0,
      documents: [],
      compliance: {
        compliant: false,
        missingMandatoryDocs: ['RUT', 'CAMARA_COMERCIO', 'CERTIFICACION_BANCARIA'],
        expiredDocs: []
      }
    };

    setSuppliers([newSupplier, ...suppliers]);
    setIsRegisterModalOpen(false);
    setSelectedSupplier(newSupplier);
  };

  const handleAttachDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const newDoc: SupplierDocument = {
      id: `doc-${Date.now()}`,
      documentType: docFormData.documentType,
      title: docFormData.title,
      fileUrl: docFormData.fileUrl || 'https://storage.agency.com/doc-sample.pdf',
      expiryDate: docFormData.expiryDate || null,
      isVerified: true,
      status: 'ACTIVE',
    };

    const updatedDocuments = [...(selectedSupplier.documents || []), newDoc];
    const mandatory = ['RUT', 'CAMARA_COMERCIO', 'CERTIFICACION_BANCARIA'];
    const missing = mandatory.filter(m => !updatedDocuments.some(d => d.documentType === m && d.status === 'ACTIVE'));

    const updatedSupplier: SupplierItem = {
      ...selectedSupplier,
      documents: updatedDocuments,
      compliance: {
        compliant: missing.length === 0,
        missingMandatoryDocs: missing,
        expiredDocs: []
      }
    };

    setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    setSelectedSupplier(updatedSupplier);
    setIsDocModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.taxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactEmail && s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            Catálogo Maestro de Proveedores & Homologación
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Gestión integral de terceros de compras: información fiscal y legal, datos de contacto, acuerdos y plazos comerciales, junto con la auditoría documental de certificaciones obligatorias (RUT, Cámara de Comercio y Bancaria).
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar Proveedor
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por NIT, nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            Categoría:
          </span>
          {['ALL', 'RAW_MATERIALS', 'LOGISTICS', 'SERVICES', 'TECHNOLOGY', 'GENERAL'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                categoryFilter === cat
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30 border border-slate-800/80 rounded-2xl">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No se encontraron proveedores coincidentes.</p>
            </div>
          ) : (
            filteredSuppliers.map(sup => {
              const isSelected = selectedSupplier?.id === sup.id;
              const isCompliant = sup.compliance?.compliant;

              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900/90 border-teal-500/50 shadow-md shadow-teal-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{sup.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-400 border border-slate-700">
                          {sup.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {sup.taxType}: <strong className="text-slate-300">{sup.taxId}</strong> · {sup.city || sup.country}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCompliant ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60" title="Cumple con todas las certificaciones obligatorias">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          HOMOLOGADO
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60" title="Pendiente documentación obligatoria">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          DOCS PENDIENTES
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commercial summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Plazo Crédito</span>
                      <span className="text-slate-200 font-semibold">{sup.paymentTermsDays} días</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Cupo Aprobado</span>
                      <span className="text-slate-200 font-semibold">${(sup.creditLimit / 1000000).toFixed(1)}M {sup.currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Descuento Comercial</span>
                      <span className="text-slate-200 font-semibold">{sup.discountRatePct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Calificación</span>
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {sup.ratingScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Supplier Detail & Certification Inspector */}
        <div className="space-y-4">
          {selectedSupplier ? (
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedSupplier.name}</h3>
                  <span className="text-xs font-mono text-teal-400">{selectedSupplier.taxId}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  selectedSupplier.status === 'ACTIVE' 
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                }`}>
                  {selectedSupplier.status}
                </span>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Información de Contacto
                </span>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{selectedSupplier.contactEmail || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedSupplier.contactPhone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedSupplier.city || 'Colombia'}</span>
                </div>
              </div>

              {/* Commercial Conditions */}
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Condiciones Comerciales
                </span>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Plazo de Pago:</span>
                  <span className="font-semibold">{selectedSupplier.paymentTermsDays} días netos</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Cupo de Crédito:</span>
                  <span className="font-semibold">${selectedSupplier.creditLimit.toLocaleString('es-CO')} {selectedSupplier.currency}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Descuento Pronto Pago:</span>
                  <span className="font-semibold">{selectedSupplier.discountRatePct}%</span>
                </div>
              </div>

              {/* Document Compliance Section */}
              <div className="space-y-3 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Certificaciones y Homologación
                  </span>
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adjuntar
                  </button>
                </div>

                {/* Missing alerts */}
                {selectedSupplier.compliance && !selectedSupplier.compliance.compliant && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Documentos Obligatorios Faltantes:
                    </div>
                    <ul className="list-disc list-inside text-[10px] text-amber-400/90 pl-1">
                      {selectedSupplier.compliance.missingMandatoryDocs.map(doc => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Attached Docs List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedSupplier.documents && selectedSupplier.documents.length > 0 ? (
                    selectedSupplier.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-white block truncate">{doc.title}</span>
                          <span className="text-[9px] font-mono text-teal-400">[{doc.documentType}]</span>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-teal-400 rounded transition"
                          title="Ver documento"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No hay documentos cargados aún.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              Selecciona un proveedor de la lista para ver su información comercial y documentación legal.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Registrar Proveedor */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in fade-in-50 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              Alta de Proveedor en Catálogo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa los datos fiscales, comerciales y de contacto del nuevo proveedor.
            </p>

            <form onSubmit={handleRegisterSupplier} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Nombre Comercial *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Distribuidora Central SAS"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">NIT / Identificación *</label>
                  <input
                    required
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Ej: 900.123.456-7"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="RAW_MATERIALS">Materia Prima</option>
                    <option value="LOGISTICS">Logística & Envíos</option>
                    <option value="SERVICES">Servicios Profesionales</option>
                    <option value="TECHNOLOGY">Tecnología & Software</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Correo de Contacto</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="proveedor@empresa.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Plazo de Pago (Días)</label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Cupo de Crédito (COP)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjuntar Documento */}
      {isDocModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in-50 duration-200">
            <button
              onClick={() => setIsDocModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-teal-400" />
              Adjuntar Documento Legal
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Carga certificaciones para: <strong className="text-white">{selectedSupplier.name}</strong>
            </p>

            <form onSubmit={handleAttachDocument} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Tipo de Documento</label>
                <select
                  value={docFormData.documentType}
                  onChange={(e) => setDocFormData({ ...docFormData, documentType: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="RUT">RUT (Registro Único Tributario)</option>
                  <option value="CAMARA_COMERCIO">Cámara de Comercio</option>
                  <option value="CERTIFICACION_BANCARIA">Certificación Bancaria</option>
                  <option value="ISO_9001">Certificación ISO 9001</option>
                  <option value="SARLAFT">Formulario SARLAFT / SAGRILAFT</option>
                  <option value="ACUERDO_CONFIDENCIALIDAD">Acuerdo de Confidencialidad</option>
                  <option value="OTRO">Otro Documento</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Título del Documento *</label>
                <input
                  required
                  type="text"
                  value={docFormData.title}
                  onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                  placeholder="Ej: RUT Vigente 2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">URL o Archivo Digital</label>
                <input
                  type="text"
                  value={docFormData.fileUrl}
                  onChange={(e) => setDocFormData({ ...docFormData, fileUrl: e.target.value })}
                  placeholder="https://storage.empresa.com/documento.pdf"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Fecha de Expiración (Opcional)</label>
                <input
                  type="date"
                  value={docFormData.expiryDate}
                  onChange={(e) => setDocFormData({ ...docFormData, expiryDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md"
                >
                  Guardar y Homologar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
