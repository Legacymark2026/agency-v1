"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleTwoFactor } from "@/app/actions/settings";

export function TwoFactorToggle({ initialData }: { initialData?: any }) {
    const [isEnabled, setIsEnabled] = useState(initialData?.mfaEnabled || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        const result = await toggleTwoFactor(!isEnabled);

        if (result.success) {
            setIsEnabled(!isEnabled);
            if (!isEnabled) {
                toast.success("Autenticación de Dos Factores activada", {
                    description: "Tu cuenta ahora es mucho más segura."
                });
            } else {
                toast.info("Autenticación de Dos Factores desactivada", {
                    description: "Recomendamos mantenerla activada para mayor seguridad."
                });
            }
        } else {
            toast.error(result.error || "Ocurrió un error");
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className={`p-4 rounded-full h-fit ${isEnabled ? 'bg-green-100/50 text-green-600' : 'bg-slate-200/50 text-slate-500'}`}>
                {isEnabled ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>

            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                    Autenticación de Dos Factores (2FA)
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-xl">
                    Agrega una capa adicional de seguridad a tu cuenta. Una vez activado, se te pedirá un código seguro generado por tu aplicación de autenticación al iniciar sesión.
                </p>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleToggle}
                        disabled={isLoading}
                        variant={isEnabled ? "outline" : "primary"}
                        className={isEnabled ? "border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" : "bg-slate-900 text-white"}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isEnabled ? "Desactivar 2FA" : "Configurar 2FA"}
                    </Button>

                    {isEnabled && (
                        <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Protegido
                        </span>
                    )}
                </div>
            </div>

            {!isEnabled && (
                <div className="hidden lg:flex items-center justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <Smartphone className="w-12 h-12 text-slate-300" strokeWidth={1} />
                </div>
            )}
        </div>
    );
}
