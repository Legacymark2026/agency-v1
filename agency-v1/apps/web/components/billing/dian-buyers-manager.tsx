"use client";

import React, { useState } from "react";
import { Users, Plus, Mail, Phone, MapPin, Building, Edit3, Trash2, ShieldCheck, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface DianBuyerRecord {
    id: string;
    documentType: "CC" | "NIT" | "CE" | "PPT" | "PASAPORTE";
    documentNumber: string;
    dv?: string; // Dígito de Verificación para NIT
    name: string; // Razón Social o Nombres Apellidos
    email: string;
    phone: string;
    taxRegime: "O-48" | "O-47" | "R-99-PN"; // O-48 Responsable IVA, O-47 Simple, R-99 No Resp
    taxResponsibility: "O-13" | "O-15" | "O-23" | "R-99-PN"; // Gran Contribuyente, Autorretenedor, etc.
    department: string;
    city: string;
    cityCode: string; // Código DIVIPOLA DANE (ej: 68001 Bucaramanga, 11001 Bogotá)
    address: string;
    postalCode?: string;
}

export function DianBuyersManager() {
    const [buyers, setBuyers] = useState<DianBuyerRecord[]>([
        {
            id: "1",
            documentType: "NIT",
            documentNumber: "890211126",
            dv: "4",
            name: "CARLIXPLAST S.A.S",
            email: "facturacion@carlixplast.com",
            phone: "3123010693",
            taxRegime: "O-48",
            taxResponsibility: "O-13",
            department: "Santander",
            city: "Bucaramanga",
            cityCode: "68001",
            address: "Calle 33 No. 11-83",
            postalCode: "680002",
        },
        {
            id: "2",
            documentType: "CC",
            documentNumber: "1007306770",
            name: "HEYBER FLOREZ",
            email: "enriquebohorquez02@gmail.com",
            phone: "31451629141",
            taxRegime: "R-99-PN",
            taxResponsibility: "R-99-PN",
            department: "Santander",
            city: "Bucaramanga",
            cityCode: "68001",
            address: "Carrera 27 # 36-14",
            postalCode: "680001",
        },
        {
            id: "3",
            documentType: "NIT",
            documentNumber: "901345678",
            dv: "1",
            name: "DISTRIBUIDORA INDUSTRIAL DEL ORIENTE S.A.S",
            email: "contabilidad@dioriente.com",
            phone: "3109876543",
            taxRegime: "O-48",
            taxResponsibility: "O-15",
            department: "Cundinamarca",
            city: "Bogotá D.C.",
            cityCode: "11001",
            address: "Av. El Dorado # 68D-35",
            postalCode: "110911",
        },
    ]);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState<DianBuyerRecord | null>(null);

    const [form, setForm] = useState<Partial<DianBuyerRecord>>({
        documentType: "NIT",
        documentNumber: "",
        dv: "",
        name: "",
        email: "",
        phone: "",
        taxRegime: "O-48",
        taxResponsibility: "R-99-PN",
        department: "Santander",
        city: "Bucaramanga",
        cityCode: "68001",
        address: "",
        postalCode: "680001",
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.documentNumber) {
            toast.error("Ingrese Razón Social y Número de Documento.");
            return;
        }

        if (editingBuyer) {
            setBuyers(prev => prev.map(b => b.id === editingBuyer.id ? { ...b, ...form } as DianBuyerRecord : b));
            toast.success("Comprador / Adquiriente actualizado");
        } else {
            const newBuyer: DianBuyerRecord = {
                id: Date.now().toString(),
                documentType: form.documentType as any,
                documentNumber: form.documentNumber || "",
                dv: form.dv || "",
                name: form.name || "",
                email: form.email || "",
                phone: form.phone || "",
                taxRegime: form.taxRegime as any || "O-48",
                taxResponsibility: form.taxResponsibility as any || "R-99-PN",
                department: form.department || "Santander",
                city: form.city || "Bucaramanga",
                cityCode: form.cityCode || "68001",
                address: form.address || "",
                postalCode: form.postalCode || "680001",
            };
            setBuyers(prev => [...prev, newBuyer]);
            toast.success("Nuevo Adquiriente registrado en el catálogo DIAN");
        }

        setShowModal(false);
        setEditingBuyer(null);
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Desea eliminar este comprador del directorio?")) return;
        setBuyers(prev => prev.filter(b => b.id !== id));
        toast.success("Adquiriente eliminado");
    };

    const filtered = buyers.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.documentNumber.includes(search) ||
        b.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Directorio Maestro de Adquirientes / Compradores DIAN 🇨🇴
                        </h3>
                        <p className="text-xs text-slate-400">
                            Registro fiscal de NIT/Cédula, Régimen Tributario, Responsabilidades y Códigos DIVIPOLA DANE.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar por NIT, Nombre o Email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setEditingBuyer(null);
                            setForm({
                                documentType: "NIT",
                                documentNumber: "",
                                dv: "",
                                name: "",
                                email: "",
                                phone: "",
                                taxRegime: "O-48",
                                taxResponsibility: "R-99-PN",
                                department: "Santander",
                                city: "Bucaramanga",
                                cityCode: "68001",
                                address: "",
                                postalCode: "680001",
                            });
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Adquiriente
                    </button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 uppercase bg-slate-900 border-b border-slate-800 text-[10px]">
                        <tr>
                            <th className="p-3.5 font-bold">Razón Social / Nombre Comprador</th>
                            <th className="p-3.5 font-bold">Identificación Fiscal</th>
                            <th className="p-3.5 font-bold">Régimen & Responsabilidad</th>
                            <th className="p-3.5 font-bold">Contacto & Correo Recepción</th>
                            <th className="p-3.5 font-bold">Ubicación (DIVIPOLA DANE)</th>
                            <th className="p-3.5 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filtered.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-3.5">
                                    <div className="font-bold text-white text-sm">{b.name}</div>
                                    <div className="text-slate-400 text-[10px]">{b.address}</div>
                                </td>
                                <td className="p-3.5 font-mono text-emerald-400 font-bold">
                                    {b.documentType}: {b.documentNumber}{b.dv ? `-${b.dv}` : ""}
                                </td>
                                <td className="p-3.5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mr-1">
                                        {b.taxRegime}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                        {b.taxResponsibility}
                                    </span>
                                </td>
                                <td className="p-3.5">
                                    <div className="flex flex-col gap-0.5 text-slate-300">
                                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {b.email}</span>
                                        <span className="flex items-center gap-1 font-mono text-[11px]"><Phone className="w-3 h-3 text-slate-500" /> {b.phone}</span>
                                    </div>
                                </td>
                                <td className="p-3.5">
                                    <div className="flex items-center gap-1 text-slate-300">
                                        <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                                        <span>{b.city}, {b.department}</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500">DANE: {b.cityCode}</div>
                                </td>
                                <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => {
                                                setEditingBuyer(b);
                                                setForm({ ...b });
                                                setShowModal(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(b.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
                        <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                            <Users className="w-5 h-5 text-indigo-400" />
                            {editingBuyer ? "Editar Adquiriente DIAN" : "Nuevo Comprador / Adquiriente DIAN"}
                        </h4>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Tipo de Documento</label>
                                    <select
                                        value={form.documentType}
                                        onChange={e => setForm({ ...form, documentType: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                                    >
                                        <option value="NIT">NIT (Persona Jurídica / PN)</option>
                                        <option value="CC">Cédula de Ciudadanía (CC)</option>
                                        <option value="CE">Cédula de Extranjería (CE)</option>
                                        <option value="PPT">Permiso por Protección Temporal (PPT)</option>
                                        <option value="PASAPORTE">Pasaporte (Cliente Exterior)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">N° Documento / NIT *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text" required placeholder="890211126"
                                            value={form.documentNumber} onChange={e => setForm({ ...form, documentNumber: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-indigo-500"
                                        />
                                        {form.documentType === "NIT" && (
                                            <input
                                                type="text" maxLength={1} placeholder="DV"
                                                value={form.dv} onChange={e => setForm({ ...form, dv: e.target.value })}
                                                className="w-12 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-center text-emerald-400 font-mono font-bold outline-none"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Razón Social o Nombres y Apellidos *</label>
                                    <input
                                        type="text" required placeholder="Ej: CARLIXPLAST S.A.S"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Correo Electrónico Recepción FE *</label>
                                    <input
                                        type="email" required placeholder="facturacion@empresa.com"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Teléfono Contacto</label>
                                    <input
                                        type="text" placeholder="3123010693"
                                        value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Régimen Fiscal DIAN</label>
                                    <select
                                        value={form.taxRegime} onChange={e => setForm({ ...form, taxRegime: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                                    >
                                        <option value="O-48">O-48 - Responsable de IVA</option>
                                        <option value="O-47">O-47 - Régimen Simple de Tributación (RST)</option>
                                        <option value="R-99-PN">R-99-PN - No Responsable de IVA (Persona Natural)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Responsabilidad Tributaria</label>
                                    <select
                                        value={form.taxResponsibility} onChange={e => setForm({ ...form, taxResponsibility: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold outline-none focus:border-indigo-500"
                                    >
                                        <option value="R-99-PN">R-99-PN - No Aplica / Estándar</option>
                                        <option value="O-13">O-13 - Gran Contribuyente</option>
                                        <option value="O-15">O-15 - Autorretenedor</option>
                                        <option value="O-23">O-23 - Agente de Retención IVA</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Municipio (Ciudad)</label>
                                    <input
                                        type="text" placeholder="Bucaramanga"
                                        value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold text-slate-300">Código DIVIPOLA DANE</label>
                                    <input
                                        type="text" placeholder="68001"
                                        value={form.cityCode} onChange={e => setForm({ ...form, cityCode: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1 col-span-2">
                                    <label className="font-bold text-slate-300">Dirección Comercial</label>
                                    <input
                                        type="text" placeholder="Calle 33 No. 11-83"
                                        value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                                >
                                    Guardar Comprador
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
