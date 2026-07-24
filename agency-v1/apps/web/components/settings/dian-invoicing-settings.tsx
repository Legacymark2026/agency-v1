"use client";

import { useState } from "react";
import { ShieldCheck, Building2, FileText, Key, CheckCircle2, AlertTriangle, Save, RefreshCw, Layers, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateDianInvoicingSettings } from "@/app/actions/settings";

interface DianInvoicingSettingsProps {
    initialConfig?: any;
}

export function DianInvoicingSettings({ initialConfig }: DianInvoicingSettingsProps) {
    const config = initialConfig?.dianConfig || {};

    const [activeTab, setActiveTab] = useState<"issuer" | "resolution" | "software">("issuer");
    const [isSaving, setIsSaving] = useState(false);

    // Emisor State
    const [companyName, setCompanyName] = useState(config.companyName || "GARCIA DURAN NESTOR ELIAN");
    const [tradeName, setTradeName] = useState(config.tradeName || "GARCIA DURAN NESTOR ELIAN");
    const [nit, setNit] = useState(config.nit || "1005462317");
    const [dv, setDv] = useState(config.dv || "1");
    const [taxpayerType, setTaxpayerType] = useState(config.taxpayerType || "Persona Natural");
    const [taxRegime, setTaxRegime] = useState(config.taxRegime || "R-99-PN");
    const [taxResponsibility, setTaxResponsibility] = useState(config.taxResponsibility || "ZZ - No aplica");
    const [economicActivity, setEconomicActivity] = useState(config.economicActivity || "7310");
    const [country, setCountry] = useState(config.country || "Colombia");
    const [department, setDepartment] = useState(config.department || "Santander");
    const [city, setCity] = useState(config.city || "Bucaramanga");
    const [address, setAddress] = useState(config.address || "CL 12 # 19 - 18 MZ 20 CA 1");
    const [phone, setPhone] = useState(config.phone || "3153981340");
    const [email, setEmail] = useState(config.email || "nestorgarcia1005462@gmail.com");

    // Logo & Official Invoice Branding State
    const [logoUrl, setLogoUrl] = useState(config.logoUrl || "https://carlixplast.com/logo.png");
    const [slogan, setSlogan] = useState(config.slogan || "Soluciones Amigables");
    const [certifications, setCertifications] = useState(config.certifications || "ISO 9001 - ISO 45001");
    const [pqrPhone, setPqrPhone] = useState(config.pqrPhone || "PQR - 3123010693");
    const [pqrEmail, setPqrEmail] = useState(config.pqrEmail || "facturacion@carlixplast.com");
    const [sellerName, setSellerName] = useState(config.sellerName || "WILSON TAPIA 8 GONZALEZ");
    const [legalFooterText, setLegalFooterText] = useState(config.legalFooterText || "SOMOS GRANDES CONTRIBUYENTES DE ICA EN BUCARAMANGA SEGUN RESOLUCION 3331 DEL 18 DE ABRIL DE 2022");

    // Resolución & Numeración State
    const [dianPrefix, setDianPrefix] = useState(config.dianPrefix || "SETG");
    const [dianFromNumber, setDianFromNumber] = useState(config.dianFromNumber || "980000000");
    const [dianToNumber, setDianToNumber] = useState(config.dianToNumber || "990000000");
    const [dianCurrentNumber, setDianCurrentNumber] = useState(config.dianCurrentNumber || "980000001");
    const [dianResolutionNumber, setDianResolutionNumber] = useState(config.dianResolutionNumber || "18760000001");
    const [dianResolutionDate, setDianResolutionDate] = useState(config.dianResolutionDate || "2026-01-15");
    const [dianResolutionDueDate, setDianResolutionDueDate] = useState(config.dianResolutionDueDate || "2027-01-15");
    const [dianTechnicalKey, setDianTechnicalKey] = useState(config.dianTechnicalKey || "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11");

    // Software & Habilitación State
    const [environment, setEnvironment] = useState(config.environment || "HABILITACION_PRUEBAS");
    const [softwareProvider, setSoftwareProvider] = useState(config.softwareProvider || "DIAN Software Propio");
    const [dianSoftwareId, setDianSoftwareId] = useState(config.dianSoftwareId || "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
    const [dianSoftwarePin, setDianSoftwarePin] = useState(config.dianSoftwarePin || "12345");
    const [testSetId, setTestSetId] = useState(config.testSetId || "dian-test-set-88291");
    const [certificateStatus, setCertificateStatus] = useState(config.certificateStatus || "VÁLIDO HASTA 2027-12-31");

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Guardando configuración de Facturación Electrónica DIAN...");

        const payload = {
            companyName, tradeName, nit, dv, taxpayerType, taxRegime, taxResponsibility,
            economicActivity, country, department, city, address, phone, email,
            logoUrl, slogan, certifications, pqrPhone, pqrEmail, sellerName, legalFooterText,
            dianPrefix, dianFromNumber, dianToNumber, dianCurrentNumber,
            dianResolutionNumber, dianResolutionDate, dianResolutionDueDate, dianTechnicalKey,
            environment, softwareProvider, dianSoftwareId, dianSoftwarePin, testSetId, certificateStatus,
            isConfigured: true
        };

        const result = await updateDianInvoicingSettings(payload);

        if (result.success) {
            toast.success("Configuración de Facturación DIAN guardada con éxito", { id: toastId });
        } else {
            toast.error(result.error || "Ocurrió un error al guardar la configuración", { id: toastId });
        }
        setIsSaving(false);
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden mt-6 text-slate-100">
            {/* HEADER BANNER */}
            <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/60">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">Facturación Electrónica DIAN</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                environment === "PRODUCCION_EN_DIRECTO"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                                {environment === "PRODUCCION_EN_DIRECTO" ? "Producción Activa" : "Entorno de Pruebas / Habilitación"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Configura los parámetros legales, tributarios, resoluciones y credenciales de software requeridos por la DIAN (Anexo Técnico 1.8).
                        </p>
                    </div>
                </div>

                <Button
                    disabled={isSaving}
                    onClick={handleSave}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 shrink-0 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Guardar Datos DIAN
                        </>
                    )}
                </Button>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
                <button
                    onClick={() => setActiveTab("issuer")}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "issuer"
                            ? "border-emerald-500 text-emerald-400 bg-slate-900/60"
                            : "border-transparent text-slate-400 hover:text-white"
                    }`}
                >
                    <Building2 className="w-4 h-4" /> 1. Datos Tributarios del Emisor
                </button>
                <button
                    onClick={() => setActiveTab("resolution")}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "resolution"
                            ? "border-emerald-500 text-emerald-400 bg-slate-900/60"
                            : "border-transparent text-slate-400 hover:text-white"
                    }`}
                >
                    <FileText className="w-4 h-4" /> 2. Resolución & Numeración DIAN
                </button>
                <button
                    onClick={() => setActiveTab("software")}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "software"
                            ? "border-emerald-500 text-emerald-400 bg-slate-900/60"
                            : "border-transparent text-slate-400 hover:text-white"
                    }`}
                >
                    <Key className="w-4 h-4" /> 3. Software & Firma Digital
                </button>
            </div>

            {/* TAB CONTENT 1: EMISOR TRIBUTARIO */}
            {activeTab === "issuer" && (
                <div className="p-6 space-y-6">
                    {/* LOGO DE LA FACTURA & BRANDING SECTION */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Logo de la Factura Electrónica & Identidad de Marca
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-300">URL o Archivo del Logo de la Empresa (PNG / JPG / WebP / Base64)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="https://ejemplo.com/logo.png"
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                                    />
                                    <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md">
                                        Subir Archivo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        if (event.target?.result) setLogoUrl(event.target.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-[10px] text-slate-400 block">Este logo se estampará automáticamente en el encabezado superior izquierdo de todas las Facturas Electrónicas PDF / A4 de la DIAN.</span>
                            </div>

                            {/* LOGO PREVIEW CARD */}
                            <div className="bg-white p-3 rounded-xl border border-slate-300 text-slate-900 flex flex-col items-center justify-center space-y-1 text-center shadow-inner min-h-[90px]">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Vista Previa Logo En Factura</span>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo Factura DIAN" className="max-h-14 object-contain" />
                                ) : (
                                    <span className="text-xs text-slate-400 italic">Sin Logo Cargado</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Eslogan Comercial (Debajo del Logo)</label>
                                <input type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Soluciones Amigables" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <label className="font-bold text-slate-300">Certificaciones ISO / ICONTEC</label>
                                <input type="text" value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="ISO 9001 - ISO 45001" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono text-[11px]" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Razón Social / Nombre Legal *</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-semibold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Nombre Comercial</label>
                            <input
                                type="text"
                                value={tradeName}
                                onChange={(e) => setTradeName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-3 space-y-1.5">
                                <label className="font-bold text-slate-300">NIT del Emisor *</label>
                                <input
                                    type="text"
                                    value={nit}
                                    onChange={(e) => setNit(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="font-bold text-slate-300">DV *</label>
                                <input
                                    type="text"
                                    value={dv}
                                    onChange={(e) => setDv(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-white outline-none focus:border-emerald-500 font-mono font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Tipo de Contribuyente</label>
                            <select
                                value={taxpayerType}
                                onChange={(e) => setTaxpayerType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            >
                                <option value="Persona Natural">Persona Natural</option>
                                <option value="Persona Jurídica">Persona Jurídica</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Régimen Fiscal DIAN</label>
                            <select
                                value={taxRegime}
                                onChange={(e) => setTaxRegime(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            >
                                <option value="O-48">O-48 | Impuesto Sobre las Ventas - IVA</option>
                                <option value="O-47">O-47 | Régimen Simple de Tributación - SIMPLE</option>
                                <option value="R-99-PN">R-99-PN | Persona Natural No Responsable de IVA</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Responsabilidad Tributaria</label>
                            <select
                                value={taxResponsibility}
                                onChange={(e) => setTaxResponsibility(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            >
                                <option value="01 - IVA">01 - IVA (Responsable de Impuesto a las Ventas)</option>
                                <option value="04 - INC">04 - INC (Impuesto Nacional al Consumo)</option>
                                <option value="ZZ - No aplica">ZZ - No aplica</option>
                                <option value="O-13">O-13 | Gran Contribuyente</option>
                                <option value="O-15">O-15 | Autorretenedor</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Código Actividad Económica (CIIU)</label>
                            <input
                                type="text"
                                placeholder="Ej: 7310, 6201"
                                value={economicActivity}
                                onChange={(e) => setEconomicActivity(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Correo de Facturación Electrónica *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className="font-bold text-slate-300">Dirección Fiscal Completa *</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Departamento</label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Municipio / Ciudad</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Teléfono / Celular de Contacto</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: RESOLUCIÓN Y NUMERACIÓN DIAN */}
            {activeTab === "resolution" && (
                <div className="p-6 space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Prefijo Habilitado DIAN *</label>
                            <input
                                type="text"
                                placeholder="Ej: SETG, FE, POS"
                                value={dianPrefix}
                                onChange={(e) => setDianPrefix(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono font-bold uppercase"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Rango Desde *</label>
                            <input
                                type="text"
                                value={dianFromNumber}
                                onChange={(e) => setDianFromNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Rango Hasta *</label>
                            <input
                                type="text"
                                value={dianToNumber}
                                onChange={(e) => setDianToNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Consecutivo Actual</label>
                            <input
                                type="text"
                                value={dianCurrentNumber}
                                onChange={(e) => setDianCurrentNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-bold outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <label className="font-bold text-slate-300">Número de Resolución DIAN *</label>
                            <input
                                type="text"
                                placeholder="Ej: 18760000001"
                                value={dianResolutionNumber}
                                onChange={(e) => setDianResolutionNumber(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono font-bold"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Fecha Resolución</label>
                            <input
                                type="date"
                                value={dianResolutionDate}
                                onChange={(e) => setDianResolutionDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Fecha Vencimiento Resolución</label>
                            <input
                                type="date"
                                value={dianResolutionDueDate}
                                onChange={(e) => setDianResolutionDueDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="font-bold text-slate-300">Clave Técnica DIAN (Technical Key) *</label>
                        <input
                            type="text"
                            placeholder="Clave hash SHA-384 entregada por MUISCA DIAN"
                            value={dianTechnicalKey}
                            onChange={(e) => setDianTechnicalKey(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-mono text-[11px] outline-none focus:border-emerald-500 break-all"
                        />
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: SOFTWARE & FIRMA DIGITAL */}
            {activeTab === "software" && (
                <div className="p-6 space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Entorno de Emisión DIAN</label>
                            <select
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-semibold"
                            >
                                <option value="HABILITACION_PRUEBAS">Entorno de Habilitación / Pruebas</option>
                                <option value="PRODUCCION_EN_DIRECTO">Producción en Directo (Emisión Legal)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Proveedor Tecnológico / Software</label>
                            <select
                                value={softwareProvider}
                                onChange={(e) => setSoftwareProvider(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-semibold"
                            >
                                <option value="DIAN Software Propio">DIAN - Software Propio LegacyMark</option>
                                <option value="Carvajal T&S">Carvajal T&S</option>
                                <option value="Facturatech">Facturatech / Cadena</option>
                                <option value="Theia API">Theia Invoicing API</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Software ID (DIAN)</label>
                            <input
                                type="text"
                                value={dianSoftwareId}
                                onChange={(e) => setDianSoftwareId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Software PIN (DIAN)</label>
                            <input
                                type="text"
                                value={dianSoftwarePin}
                                onChange={(e) => setDianSoftwarePin(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Test Set ID (Solo Pruebas Habilitación)</label>
                            <input
                                type="text"
                                value={testSetId}
                                onChange={(e) => setTestSetId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-300">Estado Certificado Firma Digital (.pfx)</label>
                            <input
                                type="text"
                                value={certificateStatus}
                                onChange={(e) => setCertificateStatus(e.target.value)}
                                className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-400 font-semibold outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
