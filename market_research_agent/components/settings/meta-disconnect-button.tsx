"use client";

import { Button } from "@/components/ui/button";
import { disconnectIntegration } from "@/actions/integrations";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MetaDisconnectButton({ provider }: { provider: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleDisconnect = async () => {
        if (!confirm("Are you sure you want to disconnect? This will stop data syncing.")) return;

        setIsLoading(true);
        try {
            await disconnectIntegration(provider);
            toast.success("Disconnected successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to disconnect");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleDisconnect} disabled={isLoading} size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect
        </Button>
    );
}
