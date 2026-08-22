"use client";

import React, { useState } from "react";

export default function POSDashboardPage() {
  const [cart, setCart] = useState<any[]>([
    { id: "prod_01", name: "Suscripción Licencia SaaS Pro", price: 150000, qty: 1 },
    { id: "prod_02", name: "Servicio de Configuración de Agente IA", price: 350000, qty: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA" | "WOMPI">("TARJETA");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxAmount = Math.round(subtotal * 0.19); // IVA 19%
  const totalAmount = subtotal + taxAmount;

  const handleCheckout = () => {
    setShowReceiptModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Punto de Venta POS & Cierre de Caja
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Terminal de facturación rápida, cobros multicanal e impresión de recibos térmicos ESC/POS.
          </p>
        </div>
        <button
          onClick={() => alert("Informe de Cierre de Caja X/Z generado e impreso correctamente.")}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-emerald-500 text-emerald-400 text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          📊 Generar Cierre de Caja (Informe X/Z)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Catálogo de Productos & Servicios</h2>
              <input
                type="text"
                placeholder="Buscar por código de barras o nombre..."
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: "p1", name: "Licencia Pro Mensual", price: 150000 },
                { id: "p2", name: "Setup Agente IA", price: 350000 },
                { id: "p3", name: "Paquete 5,000 WhatsApp", price: 90000 },
                { id: "p4", name: "Dominio CNAME SSL", price: 60000 },
                { id: "p5", name: "Soporte VIP 24/7", price: 200000 },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setCart([...cart, { id: p.id, name: p.name, price: p.price, qty: 1 }])}
                  className="cursor-pointer bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl space-y-2 transition-all hover:bg-slate-950"
                >
                  <div className="text-xs font-bold text-slate-200">{p.name}</div>
                  <div className="text-sm font-extrabold text-emerald-400">${p.price.toLocaleString()} COP</div>
                  <div className="text-[10px] text-slate-500">+ Clic para agregar al carrito</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-4">Carrito de Compra</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{item.name}</div>
                    <div className="text-slate-400">${item.price.toLocaleString()} x {item.qty}</div>
                  </div>
                  <span className="font-extrabold text-emerald-400">${(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 mt-6 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>IVA (19%):</span>
                <span>${taxAmount.toLocaleString()} COP</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-extrabold text-base pt-2 border-t border-slate-800">
                <span>TOTAL POS:</span>
                <span>${totalAmount.toLocaleString()} COP</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-6 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Medio de Pago</span>
              <div className="grid grid-cols-3 gap-2">
                {(["EFECTIVO", "TARJETA", "WOMPI"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                      paymentMethod === m
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all"
          >
            🛒 Procesar Cobro & Imprimir Recibo
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <span className="text-4xl">🧾</span>
            <h3 className="text-lg font-bold text-slate-100">Ticket de Venta Emitido</h3>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs font-mono space-y-1 text-slate-300">
              <div>LEGACYMARK S.A.S. - NIT 900.849.201-4</div>
              <div>Ticket #: POS-880129</div>
              <div>Medio Pago: {paymentMethod}</div>
              <div className="border-b border-dashed border-slate-700 my-2" />
              <div>TOTAL PAGADO: ${totalAmount.toLocaleString()} COP</div>
            </div>
            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              ✓ Cerrar e Iniciar Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
