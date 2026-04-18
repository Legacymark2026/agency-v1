"use client";

import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ExternalLink, RefreshCw, Power } from "lucide-react";
import { disconnectIntegration } from "@/actions/integrations";
import { toast } from "sonner";

interface IntegrationAppCardProps {
    name: string;
    description: string;
    icon: ReactNode;
    brandColor: string; // e.g. "bg-blue-600"
    status: "connected" | "disconnected" | "loading" | "error";
    onConnect?: () => void;
    onDisconnect?: () => void;
    onConfigure?: () => void;
    customConnectButton?: ReactNode;
    customConfigureButton?: ReactNode;
    metrics?: { label: string; value: string }[];
    providerLink?: string;
    providerId?: string;
}

export function IntegrationAppCard({
    name,
    description,
    icon,
    brandColor,
    status,
    onConnect,
    onDisconnect,
    onConfigure,
    customConnectButton,
    customConfigureButton,
    metrics,
    providerLink,
    providerId
}: IntegrationAppCardProps) {
    const isConnected = status === "connected";
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleDisconnect = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onDisconnect) {
            onDisconnect();
            return;
        }

        if (!providerId) return;

        if (!confirm("Are you sure you want to disconnect? This will stop data syncing.")) return;

        setIsDisconnecting(true);
        try {
            await disconnectIntegration(providerId);
            toast.success("Disconnected successfully");
            window.location.href = '/dashboard/settings/integrations';
        } catch (error) {
            console.error("Disconnect error:", error);
            toast.error("Failed to disconnect. Please try again.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className="relative group bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col h-full transition-colors hover:border-slate-700 min-h-[220px]">
            {/* Top Brand Accent Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${brandColor} opacity-80`} />

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden p-2">
                        {icon}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${isConnected ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20" :
                            status === "error" ? "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20" :
                                "bg-slate-800/50 text-slate-400 ring-1 ring-inset ring-slate-700"
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-slate-500"}`}></span>
                            {isConnected ? "Conectado" : status === "error" ? "Error" : "Desconectado"}
                        </span>
                    </div>
                </div>

                <div className="mb-2">
                    <h3 className="text-lg font-bold text-white leading-tight">{name}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{description}</p>
                </div>

                {metrics && metrics.length > 0 && isConnected && (
                    <div className="mt-auto pt-4 grid grid-cols-2 gap-4">
                        {metrics.map((m, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium">{m.label}</span>
                                <span className="text-sm font-semibold text-slate-300">{m.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-3 mt-auto">
                <div className="flex gap-2 w-full justify-between sm:justify-end">
                    {providerLink && (
                        <a
                            href={providerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mr-auto my-auto text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                        >
                            Portal <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    {isConnected ? (
                        <>
                            {customConfigureButton ? customConfigureButton : onConfigure && (
                                <Button variant="outline" size="sm" onClick={onConfigure} className="h-8 border-slate-700 bg-slate-900 text-white hover:bg-slate-800">
                                    <Settings className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    Ajustes
                                </Button>
                            )}
                            {(onDisconnect || providerId) && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleDisconnect} 
                                    disabled={isDisconnecting}
                                    className="h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent"
                                >
                                    {isDisconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                                </Button>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            {customConfigureButton && customConfigureButton}
                            {customConnectButton ? customConnectButton : onConnect && (
                                <Button size="sm" onClick={onConnect} className="h-8 w-full sm:w-auto bg-slate-100 hover:bg-white text-slate-900">
                                    Conectar
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
