"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { triggerManualAudienceSync } from "@/actions/audiences";

export function AudienceSyncButton() {
  const [isPending, setIsPending] = useState(false);

  const handleSync = async () => {
    setIsPending(true);
    toast.loading("Calculating LTV Tiers and syncing with APIs...", { id: "sync-audiences" });
    
    try {
      const res = await triggerManualAudienceSync();
      if (res.success) {
        toast.success(res.message, { id: "sync-audiences" });
      } else {
        toast.error(`Sync Failed: ${res.error}`, { id: "sync-audiences" });
      }
    } catch (error: any) {
      toast.error("Internal Client Error", { description: error.message, id: "sync-audiences" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all shadow-sm
        ${isPending 
          ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" 
          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/30"
        }
      `}
    >
      <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Sincronizando...' : 'Forzar Sincronización LTV'}
    </button>
  );
}
