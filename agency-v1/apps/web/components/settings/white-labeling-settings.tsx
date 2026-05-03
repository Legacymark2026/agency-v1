"use client";

import { Upload, HelpCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useRef } from "react";
import Image from "next/image";
import { updateWhiteLabeling } from "@/app/actions/settings";

export function WhiteLabelingSettings({ initialData }: { initialData?: any }) {
    const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logoUrl || "/logo.png");
    const [primaryColor, setPrimaryColor] = useState(initialData?.whiteLabeling?.primaryColor || "#0f766e"); // teal-600
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setLogoUrl(base64String);
            
            setIsSaving(true);
            const toastId = toast.loading("Subiendo y guardando logo...");
            const result = await updateWhiteLabeling({ logoUrl: base64String, primaryColor });
            
            if (result.success) {
                toast.success("Logo corporativo actualizado.", { id: toastId });
            } else {
                toast.error("Error al guardar logo.", { id: toastId });
            }
            setIsSaving(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSavePrimaryColor = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Aplicando color primario...");

        try {
            const result = await updateWhiteLabeling({ logoUrl, primaryColor });
            if (result.success) {
                toast.success("Color corporativo aplicado con éxito.", { id: toastId });
            } else {
                toast.error(result.error || "Ocurrió un error", { id: toastId });
            }
        } catch (e) {
            toast.error("Fallo inesperado al guardar", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-teal-400" />
                        Marca Blanca (White-Labeling)
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Personaliza la apariencia del CRM para que coincida con la identidad visual de tu marca.
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Logo Upload */}
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-1/3">
                        <h4 className="font-semibold text-white">Logo de Empresa</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Aparecerá en el panel lateral, reportes y cotizaciones generadas en PDF.
                        </p>
                    </div>
                    <div className="flex-1 flex items-start gap-4">
                        <div className="w-48 h-24 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden group">
                            {logoUrl ? (
                                <>
                                    <Image src={logoUrl} alt="Company Logo" fill className="object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                                            Cambiar
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <button className="flex flex-col items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs font-medium">Subir Logo (.PNG transparente)</span>
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/png, image/jpeg, image/svg+xml"
                                onChange={handleLogoUpload}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-800/60 w-full" />

                {/* Primary Color */}
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-1/3">
                        <h4 className="font-semibold text-white">Color Primario</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Define el color de los botones principales y elementos destacados del sistema.
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <div className="flex flex-col">
                                <span className="font-mono text-sm text-slate-200 font-semibold">{primaryColor}</span>
                                <span className="text-xs text-slate-500">Valor HEX</span>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                            <span className="text-sm font-medium text-slate-400">Previsualización del Botón:</span>
                            <Button style={{ backgroundColor: primaryColor }} onClick={handleSavePrimaryColor} disabled={isSaving}>
                                {isSaving ? "Guardando..." : "Guardar Preferencia"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
