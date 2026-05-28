"use client";

import { useState, useCallback } from "react";
import { verifyIntegrationConnection, type VerifyResult } from "@/actions/integration-config";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    CheckCircle2, XCircle, AlertTriangle, Loader2,
    Wifi, Clock, ExternalLink, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

interface IntegrationVerifyDialogProps {
    provider: string;
    integrationName: string;
    open: boolean;
    onClose: () => void;
}

type CheckState = "idle" | "loading" | "done";

export function IntegrationVerifyDialog({
    provider,
    integrationName,
    open,
    onClose,
}: IntegrationVerifyDialogProps) {
    const [state, setState] = useState<CheckState>("idle");
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const runCheck = useCallback(async () => {
        setState("loading");
        setResult(null);
        setShowDetail(false);
        try {
            const res = await verifyIntegrationConnection(provider);
            setResult(res);
        } catch (e: any) {
            setResult({
                ok: false,
                latencyMs: 0,
                message: "Error interno al verificar la conexión",
                detail: e?.message,
                checkedAt: new Date().toISOString(),
            });
        } finally {
            setState("done");
        }
    }, [provider]);

    // Auto-run on first open
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && state === "idle") {
            runCheck();
        }
        if (!isOpen) {
            onClose();
            // Reset after close animation
            setTimeout(() => {
                setState("idle");
                setResult(null);
                setShowDetail(false);
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-slate-950 border border-slate-800 text-white max-w-lg shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Wifi className="w-5 h-5 text-cyan-400" />
                        Verificar Conexión — {integrationName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Loading State */}
                    {state === "loading" && (
                        <div className="flex flex-col items-center justify-center gap-4 py-10">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-300 font-medium">Verificando conexión real…</p>
                                <p className="text-slate-500 text-sm mt-1">
                                    Contactando la API de {integrationName} con tus credenciales
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Result State */}
                    {state === "done" && result && (
                        <div className="space-y-4">
                            {/* Status Banner */}
                            <div className={`rounded-xl border p-5 flex items-start gap-4 transition-all ${
                                result.ok
                                    ? "bg-emerald-500/8 border-emerald-500/25"
                                    : "bg-red-500/8 border-red-500/25"
                            }`}>
                                <div className="shrink-0 mt-0.5">
                                    {result.ok ? (
                                        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-7 h-7 text-red-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-base leading-snug ${result.ok ? "text-emerald-300" : "text-red-300"}`}>
                                        {result.ok ? "Conexión exitosa" : "Error de conexión"}
                                    </p>
                                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                                        {result.message}
                                    </p>
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 rounded-lg border border-slate-800 px-4 py-3 flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-mono">Latencia</div>
                                        <div className={`text-sm font-semibold mt-0.5 ${
                                            result.latencyMs < 500 ? "text-emerald-400"
                                            : result.latencyMs < 2000 ? "text-amber-400"
                                            : "text-red-400"
                                        }`}>
                                            {result.latencyMs > 0 ? `${result.latencyMs}ms` : "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-800 px-4 py-3 flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        result.ok ? "bg-emerald-400" : "bg-red-400"
                                    }`} />
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-mono">HTTP Status</div>
                                        <div className="text-sm font-semibold text-slate-200 mt-0.5">
                                            {result.status ?? "—"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Technical Detail (expandable) */}
                            {result.detail && (
                                <div className="rounded-lg border border-slate-800 overflow-hidden">
                                    <button
                                        onClick={() => setShowDetail(!showDetail)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-900/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm text-slate-400 font-medium">
                                                {result.ok ? "Información adicional" : "Detalle del error de la API"}
                                            </span>
                                        </div>
                                        {showDetail
                                            ? <ChevronUp className="w-4 h-4 text-slate-500" />
                                            : <ChevronDown className="w-4 h-4 text-slate-500" />
                                        }
                                    </button>
                                    {showDetail && (
                                        <div className="px-4 pb-4">
                                            <pre className="text-xs text-amber-300/80 font-mono bg-amber-950/20 rounded-lg p-3 whitespace-pre-wrap break-all leading-relaxed border border-amber-500/10">
                                                {result.detail}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error guidance */}
                            {!result.ok && (
                                <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 space-y-2">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Posibles causas
                                    </p>
                                    <ul className="space-y-1.5 text-sm text-slate-400">
                                        {getErrorHints(provider, result).map((hint, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-slate-600 mt-0.5">•</span>
                                                <span>{hint}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-slate-600 text-right font-mono">
                                Verificado: {new Date(result.checkedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <a
                        href={getProviderDocsUrl(provider)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                    >
                        Documentación <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex gap-2">
                        {state === "done" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={runCheck}
                                className="h-8 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Re-verificar
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getErrorHints(provider: string, result: VerifyResult): string[] {
    const generic = [
        "Verifica que las credenciales estén copiadas correctamente (sin espacios extra)",
        "El token puede haber expirado — genera uno nuevo en el portal del proveedor",
        "Comprueba que la aplicación tenga los permisos necesarios",
    ];

    const providerHints: Record<string, string[]> = {
        'meta-pixel': [
            "El CAPI Token debe tener permiso 'ads_management' o 'ads_read'",
            "El Pixel ID debe ser un número (ej: 1234567890123456)",
            "Los tokens de Sistema tienen larga duración — úsalos en lugar de tokens de usuario",
        ],
        'facebook-pixel': [
            "El CAPI Token debe tener permiso 'ads_management' o 'ads_read'",
            "El Pixel ID debe ser un número (ej: 1234567890123456)",
            "Los tokens de Sistema tienen larga duración — úsalos en lugar de tokens de usuario",
        ],
        'facebook-page': [
            "El Page Access Token expira — conéctate nuevamente via OAuth",
            "Asegúrate de tener el rol 'Admin' en la página de Facebook",
            "Los tokens de larga duración duran 60 días — refresca antes de que expiren",
        ],
        'whatsapp': [
            "El Access Token de WhatsApp Business API puede haber expirado",
            "Verifica que el Phone Number ID corresponda al número de la cuenta WABA",
            "El sistema de usuarios del token necesita el permiso 'whatsapp_business_management'",
        ],
        'tiktok-ads': [
            "El Access Token de TikTok Business tiene duración limitada (30 días)",
            "Regenera el token desde TikTok Business Center → Activos → Tokens de acceso",
            "Asegúrate de tener una cuenta de TikTok for Business activa",
        ],
        'linkedin-ads': [
            "El Access Token de LinkedIn caduca en 60 días — re-autoriza la app",
            "La aplicación debe tener el scope 'r_ads_reporting' o 'rw_ads'",
            "Verifica que la app de LinkedIn esté aprobada para Marketing API",
        ],
        'google-analytics': [
            "El API Secret es requerido solo si usas Measurement Protocol (no el tracking básico)",
            "El Measurement ID debe tener formato G-XXXXXXXXXX",
            "Verifica en Google Analytics → Admin → Streams de datos",
        ],
        'google-ads': [
            "El Developer Token debe estar aprobado por Google (no en estado de prueba básica)",
            "El Customer ID debe ser el ID del cliente de Google Ads (sin guiones: 1234567890)",
            "El Developer Token en modo prueba tiene acceso limitado a cuentas de test",
        ],
        'ai-models': [
            "La API Key debe tener créditos disponibles en la cuenta",
            "Verifica que la clave no tenga restricciones de IP o dominio",
            "Algunas organizaciones requieren activar el acceso a la API explícitamente",
        ],
        'hotjar': [
            "El Site ID debe ser solo números (encuéntralo en Hotjar → Settings → Sites & Organizations)",
            "Los sitios con plan gratuito pueden tardar en activarse",
        ],
        'ahrefs': [
            "El Data Key de Web Analytics es diferente al API Key de Ahrefs",
            "Encuéntralo en Ahrefs → Web Analytics → Settings → Data Key",
        ],
        'payu': [
            "Verifica que estés usando la API Key de producción (no de sandbox)",
            "El Merchant ID debe coincidir con el de tu cuenta de PayU Latam",
        ],
    };

    return providerHints[provider] || generic;
}

function getProviderDocsUrl(provider: string): string {
    const docs: Record<string, string> = {
        'meta-pixel': 'https://developers.facebook.com/docs/marketing-api/conversions-api',
        'facebook-pixel': 'https://developers.facebook.com/docs/marketing-api/conversions-api',
        'facebook-page': 'https://developers.facebook.com/docs/pages/access-tokens',
        'facebook': 'https://developers.facebook.com/docs/pages/access-tokens',
        'whatsapp': 'https://developers.facebook.com/docs/whatsapp/cloud-api',
        'tiktok-ads': 'https://business-api.tiktok.com/portal/docs',
        'tiktok-pixel': 'https://business-api.tiktok.com/portal/docs',
        'linkedin-ads': 'https://learn.microsoft.com/en-us/linkedin/marketing',
        'google-analytics': 'https://developers.google.com/analytics/devguides/collection/protocol/ga4',
        'google-ads': 'https://developers.google.com/google-ads/api/docs/get-started/introduction',
        'google-tag-manager': 'https://developers.google.com/tag-platform/tag-manager',
        'google-search-console': 'https://developers.google.com/webmaster-tools',
        'hotjar': 'https://help.hotjar.com/hc/en-us/articles/115011867948',
        'ahrefs': 'https://ahrefs.com/web-analytics',
        'ai-models': 'https://platform.openai.com/docs/api-reference',
        'payu': 'https://developers.payulatam.com',
    };
    return docs[provider] || 'https://docs.legacymark.com/integrations';
}
