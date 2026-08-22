"use client";

import React, { useState, useEffect } from "react";

export interface TicketQrModalProps {
  orderId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketQrModal({ orderId = "order-12345", isOpen, onClose }: TicketQrModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchTicketQr();
    }
  }, [isOpen, orderId]);

  const fetchTicketQr = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/pos/tickets/${encodeURIComponent(orderId)}/qr`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.qrData) {
          setQrCodeData(json.qrData);
          return;
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
    setQrCodeData(`data:image/svg+xml;base64,${btoa(demoSvg)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>

          <h3 className="mt-3 font-semibold text-slate-100 text-base">Ticket de Venta #{orderId}</h3>
          <p className="mt-1 text-xs text-slate-400">Escanea el código QR para factura electrónica DIAN</p>

          <div className="my-6 flex justify-center rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-inner">
            {loading ? (
              <div className="flex h-40 w-40 items-center justify-center text-slate-600 animate-pulse text-xs">
                Generando QR...
              </div>
            ) : qrCodeData ? (
              <img src={qrCodeData} alt="Código QR Ticket POS" className="h-40 w-40 object-contain" />
            ) : null}
          </div>

          <button
            onClick={() => window.print()}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-700 active:scale-95"
          >
            Imprimir Ticket Térmico
          </button>
        </div>
      </div>
    </div>
  );
}
