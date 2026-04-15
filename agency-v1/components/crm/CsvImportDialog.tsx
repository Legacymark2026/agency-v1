"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Upload, X, CheckCircle, AlertTriangle, FileText, Download } from "lucide-react";

interface ImportResult {
    imported: number;
    total: number;
    warnings: string[];
}

export function CsvImportDialog({ companyId }: { companyId: string }) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith(".csv")) setFile(f);
        else toast.error("Por favor sube un archivo .CSV");
    }, []);

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("companyId", companyId);
            const res = await fetch("/api/crm/import-deals", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                setResult(data);
                toast.success(`${data.imported} deals importados exitosamente`);
            } else {
                toast.error(data.error ?? "Error al importar");
            }
        } catch {
            toast.error("Error de conexión");
        }
        setLoading(false);
    };

    const downloadTemplate = () => {
        const csv = "title,value,stage,priority,contactName,contactEmail,source,notes,expectedClose\n" +
            "Contrato Empresa ABC,50000,PROPOSAL,HIGH,Juan Pérez,juan@abc.com,Referido,Cliente interesado en Plan Enterprise,2026-04-30\n" +
            "Renovación XYZ,15000,NEGOTIATION,MEDIUM,María García,maria@xyz.com,LinkedIn,,2026-05-15";
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url; a.download = "deals_template.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <button onClick={() => setOpen(true)} className="ds-btn ds-btn-secondary flex items-center gap-2 text-sm">
                <Upload size={14} />Importar CSV
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setOpen(false); setFile(null); setResult(null); }} />
                    <div className="relative z-10 rounded-2xl p-6 w-[520px]" style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(30,41,59,0.9)', boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="ds-icon-box w-8 h-8"><Upload size={14} className="text-teal-400" /></div>
                                <p className="font-mono text-[11px] font-black text-slate-200 uppercase tracking-widest">Importar Deals desde CSV</p>
                            </div>
                            <button onClick={() => { setOpen(false); setFile(null); setResult(null); }} className="text-slate-600 hover:text-slate-300"><X size={16} /></button>
                        </div>

                        <button onClick={downloadTemplate} className="w-full flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sky-400 hover:text-sky-300 transition-colors" style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)' }}>
                            <Download size={12} />
                            <span className="font-mono text-[9px]">Descargar plantilla CSV de ejemplo</span>
                        </button>

                        {/* Drop Zone */}
                        {!result && (
                            <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                className="cursor-pointer rounded-xl p-8 text-center transition-all mb-4"
                                style={{
                                    background: isDragging ? 'rgba(13,148,136,0.1)' : 'rgba(30,41,59,0.3)',
                                    border: `2px dashed ${isDragging ? 'rgba(13,148,136,0.5)' : 'rgba(30,41,59,0.8)'}`,
                                }}>
                                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                                {file ? (
                                    <div>
                                        <FileText size={24} className="text-teal-400 mx-auto mb-2" />
                                        <p className="font-mono text-[11px] text-slate-200 font-bold">{file.name}</p>
                                        <p className="font-mono text-[9px] text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload size={24} className="text-slate-600 mx-auto mb-3" />
                                        <p className="font-mono text-[10px] text-slate-400">Arrastra un archivo CSV aquí o haz clic para seleccionar</p>
                                        <p className="font-mono text-[8px] text-slate-600 mt-2">Columnas: title, value, stage, priority, contactName, contactEmail, source</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle size={14} className="text-teal-400" />
                                    <p className="font-mono text-[10px] font-bold text-teal-400">Importación completada</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="text-center">
                                        <p className="font-mono text-2xl font-black text-teal-400">{result.imported}</p>
                                        <p className="font-mono text-[8px] text-slate-500">Deals importados</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-mono text-2xl font-black text-slate-400">{result.total - result.imported}</p>
                                        <p className="font-mono text-[8px] text-slate-500">Omitidos</p>
                                    </div>
                                </div>
                                {result.warnings.length > 0 && (
                                    <div className="space-y-1">
                                        {result.warnings.slice(0, 5).map((w, i) => (
                                            <div key={i} className="flex items-start gap-1.5">
                                                <AlertTriangle size={9} className="text-amber-400 shrink-0 mt-0.5" />
                                                <p className="font-mono text-[8px] text-amber-500">{w}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            {!result ? (
                                <button onClick={handleImport} disabled={!file || loading}
                                    className="flex-1 py-3 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-slate-900 transition-all disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)', boxShadow: '0 0 20px rgba(13,148,136,0.3)' }}>
                                    {loading ? "Importando..." : `Importar ${file ? "archivo" : "(selecciona un archivo)"}`}
                                </button>
                            ) : (
                                <button onClick={() => { setOpen(false); setFile(null); setResult(null); }}
                                    className="flex-1 py-3 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-slate-200 transition-all"
                                    style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(30,41,59,0.9)' }}>
                                    Cerrar y ver Pipeline
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
