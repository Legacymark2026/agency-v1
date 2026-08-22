"use client";

import React, { useState, useEffect } from "react";

export interface OfflineSyncBannerProps {
  companyId?: string;
  className?: string;
}

export function OfflineSyncBanner({ companyId = "company-default", className = "" }: OfflineSyncBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    setIsOnline(navigator.onLine);
    const mockPending = parseInt(localStorage.getItem("pos_pending_offline_count") || "3", 10);
    setPendingCount(mockPending);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const mockTransactions = [
        {
          id: `tx-${Date.now()}`,
          orderNumber: `OFF-${Math.floor(1000 + Math.random() * 9000)}`,
          totalAmount: 125.50,
          cashierId: "cashier-1",
          paymentMethod: "CASH",
          items: [{ productId: "prod-101", quantity: 2, price: 62.75 }],
          createdAt: new Date().toISOString()
        }
      ];

      const res = await fetch("/api/v1/pos/sync-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, transactions: mockTransactions })
      });

      if (res.ok) {
        localStorage.setItem("pos_pending_offline_count", "0");
        setPendingCount(0);
        alert("Sincronización de ventas offline completada con éxito.");
        return;
      }
    } catch {
      alert("No se pudo conectar al servidor para sincronizar.");
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all ${!isOnline ? "border-amber-500/30 bg-amber-950/40 text-amber-200" : "border-teal-500/30 bg-slate-900/80 text-slate-200"} ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-3 w-3 rounded-full ${!isOnline ? "bg-amber-500 animate-ping" : "bg-teal-400 animate-pulse"}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {!isOnline ? "Modo Offline Activo" : "Ventas Pendientes de Sincronizar"}
            </div>
            <div className="text-xs opacity-80">
              {!isOnline
                ? "No hay conexión a internet. Las ventas se están guardando localmente."
                : `Tienes ${pendingCount} venta(s) registradas offline listas para subir al servidor.`}
            </div>
          </div>
        </div>

        {pendingCount > 0 && isOnline && (
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-teal-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-teal-400 active:scale-95 disabled:opacity-50"
          >
            {syncing ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Sincronizar Ventas ({pendingCount})
          </button>
        )}
      </div>
    </div>
  );
}
