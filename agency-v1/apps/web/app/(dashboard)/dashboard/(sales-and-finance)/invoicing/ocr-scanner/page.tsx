"use client";

import React, { useState } from "react";

export default function OCRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [ocrData, setOcrData] = useState<any>({
    vendorName: "SUMINISTROS Y TECNOLOGIA COLOMBIA S.A.S.",
    vendorNit: "900.849.201-4",
    subtotalAmount: 500000,
    taxAmount: 95000,
    totalAmount: 595000,
    category: "OPERACIONAL",
    confidenceScore: 0.96,
  });

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
          Escáner OCR Automatizado de Recibos y Facturas
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sube facturas en PDF o imagen para extracción inteligente e ingestión automática de gastos contables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Zone */}
        <div
          onClick={handleSimulateScan}
          className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/60 backdrop-blur-xl p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 transition-all hover:bg-slate-900/90"
        >
          <div className="text-5xl">📄</div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Haz clic o arrastra una factura aquí</h3>
            <p className="text-xs text-slate-400 mt-1">Soporta archivos PDF, PNG, JPG (máx. 10MB)</p>
          </div>
          {isScanning ? (
            <span className="text-indigo-400 text-sm font-semibold animate-pulse">Escaneando documento con IA...</span>
          ) : (
            <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs">
              Simular Carga de Factura
            </button>
          )}
        </div>

        {/* Extracted Fields */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200">Campos Extraídos por OCR</h2>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/40">
              Confianza: {(ocrData.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">Proveedor:</span>
              <span className="font-bold text-slate-100">{ocrData.vendorName}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">NIT Proveedor:</span>
              <span className="font-bold text-indigo-400">{ocrData.vendorNit}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">Subtotal:</span>
              <span className="font-bold text-slate-200">${ocrData.subtotalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">IVA (19%):</span>
              <span className="font-bold text-amber-400">${ocrData.taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30">
              <span className="text-indigo-300 font-bold">Total A Pagar:</span>
              <span className="font-extrabold text-indigo-300 text-lg">${ocrData.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => alert("Gasto registrado exitosamente en la contabilidad.")}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            ✓ Confirmar y Registrar Gasto Automático
          </button>
        </div>
      </div>
    </div>
  );
}
