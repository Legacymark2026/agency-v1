"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { syncMetaConversations } from "@/actions/inbox";
import { RefreshCw, Facebook, Instagram, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function MetaSyncButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const router = useRouter();

    const handleSync = async () => {
        setIsLoading(true);
        setResult(null);

        try {
            const syncResult = await syncMetaConversations();
            setResult(syncResult);

            if (syncResult.success) {
                router.refresh();
            }
        } catch (error: any) {
            setResult({
                success: false,
                errors: [error.message]
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Button
                onClick={handleSync}
                disabled={isLoading}
                size="sm"
                // FIX #6: Use dark HUD teal theme instead of light blue-600
                style={{
                    background: isLoading
                        ? 'rgba(13,148,136,0.1)'
                        : 'linear-gradient(135deg, #0d7a72, #0d9488)',
                    border: '1px solid rgba(13,148,136,0.4)',
                    color: isLoading ? '#2dd4bf' : 'white',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '0.03em',
                }}
            >
                {isLoading ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <Facebook className="mr-2 h-4 w-4" />
                        <Instagram className="mr-1 h-4 w-4" />
                        Sync Meta Messages
                    </>
                )}
            </Button>

            {/* FIX #6: Replace light bg-green-50 / bg-red-50 with dark HUD palette */}
            {result && (
                <div style={{
                    fontSize: '11px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    background: result.success
                        ? 'rgba(13,148,136,0.08)'
                        : 'rgba(239,68,68,0.08)',
                    border: result.success
                        ? '1px solid rgba(13,148,136,0.3)'
                        : '1px solid rgba(239,68,68,0.3)',
                    color: result.success ? '#2dd4bf' : '#f87171',
                }}>
                    {result.success ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <CheckCircle2 style={{ flexShrink: 0, marginTop: '1px' }} size={14} />
                            <div>
                                <p style={{ fontWeight: 800, marginBottom: '4px' }}>Sync exitoso</p>
                                <p style={{ color: 'rgba(45,212,191,0.7)', fontSize: '10px' }}>
                                    {result.conversationsSynced} conversaciones · {result.messagesSynced} mensajes
                                </p>
                                {result.conversationsSynced === 0 && (
                                    <p style={{
                                        marginTop: '6px', fontSize: '10px',
                                        color: 'rgba(45,212,191,0.6)',
                                        background: 'rgba(13,148,136,0.06)',
                                        padding: '6px 8px', borderRadius: '6px',
                                        border: '1px solid rgba(13,148,136,0.15)'
                                    }}>
                                        Tip: Envía un mensaje NUEVO a tu Página de Facebook o Instagram para probar.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <XCircle style={{ flexShrink: 0, marginTop: '1px' }} size={14} />
                            <div>
                                <p style={{ fontWeight: 800, marginBottom: '4px' }}>Sync Fallido</p>
                                <p style={{ color: 'rgba(248,113,113,0.8)', fontSize: '10px' }}>
                                    {result.error || result.errors?.[0] || 'Error desconocido'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
