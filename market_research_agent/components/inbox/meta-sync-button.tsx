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
                // Refresh the page to show new conversations
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
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

            {result && (
                <div className={`text-xs p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {result.success ? (
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Sync Successful!</p>
                                <p className="mt-1">
                                    {result.conversationsSynced} conversations, {result.messagesSynced} messages synced
                                </p>
                                {result.conversationsSynced === 0 && (
                                    <p className="mt-2 text-[10px] text-green-700 bg-green-100/50 p-2 rounded">
                                        Tip: Send a NEW message to your Facebook Page or Instagram from your personal account to test the connection.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Sync Failed</p>
                                <p className="mt-1">{result.error || result.errors?.[0] || 'Unknown error'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
