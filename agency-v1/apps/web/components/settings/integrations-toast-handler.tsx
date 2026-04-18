"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { syncMetaConversations } from "@/actions/inbox";

export function IntegrationsToastHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        if (processed) return;

        const error = searchParams.get("error");
        const success = searchParams.get("success");

        if (error || success) {
            setProcessed(true);

            if (error) {
                // Parse friendly errors if possible
                let message = decodeURIComponent(error);
                if (message === "no_code") message = "No se recibió código de autorización de Meta.";
                if (message === "access_denied") message = "Se denegó el acceso a la cuenta de Meta.";

                toast.error("Error de Integración", {
                    description: message,
                    duration: 8000
                });
            }

            if (success === "facebook_connected") {
                // Automatically trigger sync and show progress
                toast.promise(
                    syncMetaConversations(),
                    {
                        loading: 'Conexión exitosa. Sincronizando Páginas y Mensajes de Meta...',
                        success: (data) => {
                            if (data && data.success) {
                                return `¡Todo listo! Sincronizados ${data.conversationsSynced || 0} chats y ${data.messagesSynced || 0} mensajes.`;
                            }
                            if (data && !data.success) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const errorMessage = (data as any).error || ((data as any).errors && (data as any).errors[0]) || 'Error desconocido';
                                return `La cuenta se conectó, pero hubo un error al sincronizar mensajes: ${errorMessage}`;
                            }
                            return "¡Cuenta de Meta conectada y sincronizada correctamente!";
                        },
                        error: 'Meta se conectó, pero falló la sincronización inicial de mensajes.',
                    }
                );
            }

            // Remove query params from URL without refreshing the page
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete("error");
            newSearchParams.delete("success");

            const newUrl = pathname + (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            router.replace(newUrl, { scroll: false });
        }
    }, [searchParams, pathname, router, processed]);

    return null;
}
