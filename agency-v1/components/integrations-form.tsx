'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateIntegrations } from "@/actions/settings";
import { Loader2, Globe, Tag, Flame } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface IntegrationsFormProps {
    initialData: {
        gaPropertyId?: string;
        gaClientEmail?: string;
        gaPrivateKey?: string;
        fbPixelId?: string;
        gtmId?: string;
        hotjarId?: string;
    };
}

export function IntegrationsForm({ initialData }: IntegrationsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            gaPropertyId: initialData.gaPropertyId || "",
            gaClientEmail: initialData.gaClientEmail || "",
            gaPrivateKey: initialData.gaPrivateKey || "",
            fbPixelId: initialData.fbPixelId || "",
            gtmId: initialData.gtmId || "",
            hotjarId: initialData.hotjarId || "",
        },
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            const result = await updateIntegrations(data);

            if (result.success) {
                setShowModal(true);
                router.refresh();
            } else {
                setError(result.error || "Ocurrió un error al guardar.");
            }
        } catch (e) {
            setError("Error inesperado de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="¡Integración Guardada!"
                description="Las configuraciones se han actualizado correctamente."
            >
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-700">
                    <p>Los códigos de seguimiento estarán activos en la próxima carga de página.</p>
                </div>
            </Modal>

            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Configuración de Integraciones</h2>
            </div>

            <div className="p-6">
                {error && (
                    <div className="p-4 rounded-lg mb-6 text-sm bg-red-50 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Sección: Integraciones Google */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                            <Tag size={18} className="text-blue-600" />
                            <h3>Google Tag Manager</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Container ID (GTM-XXXXXX)</label>
                                <Input {...form.register("gtmId")} placeholder="Ej. GTM-AB12C3D" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Sección: Google Analytics */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                            <Globe size={18} className="text-gray-500" />
                            <h3>Google Analytics 4 (Backend API)</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Property ID</label>
                                    <Input {...form.register("gaPropertyId")} placeholder="Ej. 123456789" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Client Email</label>
                                    <Input {...form.register("gaClientEmail")} placeholder="service-account@..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Private Key</label>
                                <textarea
                                    {...form.register("gaPrivateKey")}
                                    className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm font-mono text-xs"
                                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Sección: Hotjar */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                            <Flame size={18} className="text-red-500" />
                            <h3>Hotjar</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hotjar Site ID</label>
                                <Input {...form.register("hotjarId")} placeholder="Ej. 1234567" />
                                <p className="text-xs text-gray-500">El ID numérico de tu sitio en Hotjar.</p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Sección: Facebook Pixel */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                            <span className="text-blue-600 font-bold px-1">f</span>
                            <h3>Facebook Pixel</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pixel ID</label>
                                <Input {...form.register("fbPixelId")} placeholder="Ej. 123456789012345" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="min-w-[150px]">
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Guardar Integración
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
