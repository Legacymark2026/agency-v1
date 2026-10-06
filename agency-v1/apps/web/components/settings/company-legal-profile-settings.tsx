"use client";

import { useState } from "react";
import { 
    Building2, FileText, MapPin, Mail, Phone, Globe, 
    Save, CheckCircle2, ShieldCheck, Briefcase, Hash, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateCompanyProfile } from "@/app/actions/settings";

interface CompanyProfileData {
    name?: string;
    industry?: string;
    website?: string;
    legalProfile?: {
        legalName?: string;
        taxId?: string;
        dv?: string;
        economicActivityCode?: string;
        taxRegime?: string;
        fiscalResponsibility?: string;
        email?: string;
        phone?: string;
        country?: string;
        state?: string;
        city?: string;
        address?: string;
        postalCode?: string;
    };
}

export function CompanyLegalProfileSettings({ initialData }: { initialData?: any }) {
    const legal = initialData?.defaultSettings?.legalProfile || {};

    const [form, setForm] = useState({
        name: initialData?.name || "LEGACYMARK S.A.S.",
        industry: initialData?.industry || "Software & Cloud Technology",
        website: initialData?.website || "https://legacymarksas.com",
        legalName: legal.legalName || initialData?.name || "LEGACYMARK S.A.S.",
        taxId: legal.taxId || "901345678",
        dv: legal.dv || "1",
        economicActivityCode: legal.economicActivityCode || "6201",
        taxRegime: legal.taxRegime || "RESPONSABLE_IVA",
        fiscalResponsibility: legal.fiscalResponsibility || "O-13",
        email: legal.email || "facturacion@legacymarksas.com",
        phone: legal.phone || "+57 (602) 890-0000",
        country: legal.country || "Colombia",
        state: legal.state || "Valle del Cauca",
        city: legal.city || "Cali",
        address: legal.address || "Avenida 6N # 28N-45 Oficina 502",
        postalCode: legal.postalCode || "760001",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading("Actualizando información corporativa y tributaria...");

        const res = await updateCompanyProfile(form);
        if (res.success) {
            toast.success("Información corporativa y fiscal guardada con éxito.", { id: toastId });
        } else {
            toast.error(res.error || "No se pudo actualizar la información.", { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Card 1: Datos Generales e Identidad Comercial */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-teal-400" />
                            Identidad Corporativa y Comercial
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Información visible en cotizaciones, estados de cuenta, correos transaccionales y portal B2B.
                        </p>
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isSaving} 
                        className="bg-teal-600 hover:bg-teal-700 text-white shrink-0 flex items-center gap-2 font-semibold shadow-md shadow-teal-600/20"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            Nombre Comercial / Marca
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Ej. LegacyMark Solutions"
                            className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Industria / Sector
                        </label>
                        <select
                            name="industry"
                            value={form.industry}
                            onChange={handleChange}
                            className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                        >
                            <option value="Software & Cloud Technology">Software & Cloud Technology</option>
                            <option value="Comercio Minorista / Retail">Comercio Minorista / Retail</option>
                            <option value="Manufactura y Producción">Manufactura y Producción</option>
                            <option value="Logística y Distribución (3PL)">Logística y Distribución (3PL)</option>
                            <option value="Servicios Profesionales / Consultoría">Servicios Profesionales / Consultoría</option>
                            <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                            <option value="Salud y Farmacéutica">Salud y Farmacéutica</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400" /> Sitio Web Corporativo
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://tudominio.com"
                            className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                        />
                    </div>
                </div>
            </div>

            {/* Card 2: Razón Social, Identificación Fiscal y Régimen Tributario */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Razón Social e Información Legal (RUT / DIAN)
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Datos requeridos para facturación electrónica UBL 2.1, generación de notas de crédito y títulos contables.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" /> Cumplimiento UBL 2.1
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Razón Social Registrada (Nombre Jurídico)
                            </label>
                            <input
                                type="text"
                                name="legalName"
                                value={form.legalName}
                                onChange={handleChange}
                                required
                                placeholder="Ej. LEGACYMARK S.A.S."
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    NIT / Tax ID
                                </label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={form.taxId}
                                    onChange={handleChange}
                                    required
                                    placeholder="901345678"
                                    className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    DV
                                </label>
                                <input
                                    type="text"
                                    name="dv"
                                    value={form.dv}
                                    onChange={handleChange}
                                    maxLength={1}
                                    placeholder="1"
                                    className="w-full text-sm text-center rounded-xl border border-slate-700 bg-slate-950 text-white px-2 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5 text-slate-400" /> Código Actividad CIIU
                            </label>
                            <input
                                type="text"
                                name="economicActivityCode"
                                value={form.economicActivityCode}
                                onChange={handleChange}
                                placeholder="6201 (Desarrollo de Software)"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Régimen Tributario
                            </label>
                            <select
                                name="taxRegime"
                                value={form.taxRegime}
                                onChange={handleChange}
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                            >
                                <option value="RESPONSABLE_IVA">Responsable de IVA (Común)</option>
                                <option value="NO_RESPONSABLE_IVA">No Responsable de IVA (Simplificado)</option>
                                <option value="REGIMEN_SIMPLE">Régimen Simple de Tributación (RST)</option>
                                <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Responsabilidad Fiscal DIAN
                            </label>
                            <select
                                name="fiscalResponsibility"
                                value={form.fiscalResponsibility}
                                onChange={handleChange}
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                            >
                                <option value="O-13">O-13: Gran Contribuyente</option>
                                <option value="O-15">O-15: Autorretenedor</option>
                                <option value="O-23">O-23: Agente de Retención IVA</option>
                                <option value="O-47">O-47: Régimen Simple de Tributación</option>
                                <option value="R-99-PN">R-99-PN: No Responsable</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: Ubicación y Domicilio Fiscal */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-800/60">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        Domicilio Fiscal y Canales de Notificación
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Sede principal y correos institucionales para radicación judicial y facturación tributaria.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Fiscal / Facturación
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="facturacion@empresa.com"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono Institucional / PBX
                            </label>
                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+57 (601) 555-0199"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                País
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Departamento / Estado
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                placeholder="Valle del Cauca"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Ciudad / Municipio
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="Cali"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Código Postal
                            </label>
                            <input
                                type="text"
                                name="postalCode"
                                value={form.postalCode}
                                onChange={handleChange}
                                placeholder="760001"
                                className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Dirección Física Oficial
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Calle / Carrera / Avenida, Edificio, Oficina o Bodega"
                            className="w-full text-sm rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-teal-400" />
                        Los cambios impactarán en tiempo real las facturas electrónicas y documentos PDF emitidos.
                    </span>
                    <Button 
                        type="submit" 
                        disabled={isSaving} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 font-semibold shadow-md shadow-emerald-600/20"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Guardando..." : "Guardar Información Fiscal"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
