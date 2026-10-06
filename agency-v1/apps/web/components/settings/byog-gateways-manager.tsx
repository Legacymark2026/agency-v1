"use client";

import { useState, useEffect } from "react";
import { 
    CreditCard, ShieldCheck, Key, Lock, CheckCircle2, 
    AlertCircle, RefreshCw, Sparkles, Building, Settings
} from "lucide-react";
import { toast } from "sonner";

type GatewayConfig = {
  provider: string;
  publicKey?: string;
  secretKey?: string;
  eventsSecret?: string;
  isActive: boolean;
  isTestMode: boolean;
};

type ProviderInfo = {
  id: string;
  name: string;
  color: string;
  badge: string;
  description: string;
  supportedCurrencies: string[];
};

const providersList: ProviderInfo[] = [
  { id: "STRIPE", name: "Stripe Global", color: "bg-indigo-600", badge: "Internacional", description: "Tarjetas de crédito globales, Apple Pay, Google Pay y débitos ACH.", supportedCurrencies: ["USD", "EUR", "COP"] },
  { id: "WOMPI", name: "Wompi (Bancolombia)", color: "bg-blue-800", badge: "Colombia", description: "Botón Bancolombia, PSE, Tarjetas locales, Nequi y Corresponsales.", supportedCurrencies: ["COP"] },
  { id: "MERCADOPAGO", name: "Mercado Pago", color: "bg-sky-500", badge: "Latam", description: "Procesamiento integral en América Latina con checkout dinámico.", supportedCurrencies: ["COP", "MXN", "USD"] },
  { id: "EPAYCO", name: "ePayco (Davivienda)", color: "bg-amber-600", badge: "Colombia / Latam", description: "Daviplata, Efecty, PSE, SafetyPay y pasarela local multidivisa.", supportedCurrencies: ["COP", "USD"] },
  { id: "PAYPAL", name: "PayPal Express", color: "bg-blue-600", badge: "Global", description: "Pagos de clientes internacionales mediante billeteras digitales y saldo.", supportedCurrencies: ["USD", "EUR"] },
  { id: "BOLD", name: "Bold Colombia", color: "bg-rose-600", badge: "Datáfono & Link", description: "Pagos omnicanal con links seguros y datáfonos físicos POS.", supportedCurrencies: ["COP"] },
];

export function ByogGatewaysManager() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payments/settings/gateways");
      if (res.ok) {
        const data = await res.json();
        setGateways(data.gateways || []);
      }
    } catch (err) {
      console.error("Error fetching gateways:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleSave = async (payload: GatewayConfig) => {
    const toastId = toast.loading(`Guardando llaves para ${payload.provider}...`);
    try {
      const res = await fetch("/api/payments/settings/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Pasarela ${payload.provider} configurada y cifrada con AES-256`, { id: toastId });
        setSelectedProvider(null);
        fetchGateways();
      } else {
        toast.error("Error al guardar credenciales en el servidor.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error de comunicación de red.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo de Seguridad */}
      <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Infraestructura BYOG (Bring Your Own Gateway) & Grado Militar KMS
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Tus credenciales de pasarela se almacenan con cifrado <strong className="text-teal-300">AES-256-GCM</strong> con vector de inicialización (IV) único y etiqueta de autenticación (auth tag). El dinero de las ventas va directo a tu cuenta bancaria sin intermediación de terceros.
            </p>
          </div>
        </div>

        <button
          onClick={fetchGateways}
          className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 self-start md:self-auto font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar Pasarelas
        </button>
      </div>

      {/* Grid de Pasarelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providersList.map((p) => {
          const cfg = gateways.find((g) => g.provider === p.id);
          const isActive = cfg?.isActive || false;

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${p.color}`}>
                      {p.id.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{p.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">{p.badge}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {isActive ? (cfg?.isTestMode ? "Activo (Test)" : "● En Vivo") : "Inactivo"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                  {p.supportedCurrencies.map((c) => (
                    <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {c}
                    </span>
                  ))}
                  {cfg?.publicKey && (
                    <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 ml-auto">
                      Clave configurada
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedProvider(p)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-teal-500/50 transition flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-teal-400" />
                {isActive ? "Gestionar Credenciales" : "Conectar Pasarela"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración Segura */}
      {selectedProvider && (
        <GatewayModal
          provider={selectedProvider}
          config={gateways.find((g) => g.provider === selectedProvider.id)}
          onClose={() => setSelectedProvider(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function GatewayModal({
  provider,
  config,
  onClose,
  onSave,
}: {
  provider: ProviderInfo;
  config?: GatewayConfig;
  onClose: () => void;
  onSave: (payload: GatewayConfig) => Promise<void>;
}) {
  const [publicKey, setPublicKey] = useState(config?.publicKey || "");
  const [secretKey, setSecretKey] = useState(config?.secretKey || "");
  const [eventsSecret, setEventsSecret] = useState(config?.eventsSecret || "");
  const [isActive, setIsActive] = useState(config?.isActive ?? true);
  const [isTestMode, setIsTestMode] = useState(config?.isTestMode ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      provider: provider.id,
      publicKey,
      secretKey,
      eventsSecret,
      isActive,
      isTestMode,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${provider.color}`}>
              {provider.id.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurar {provider.name}</h3>
              <p className="text-xs text-slate-400">Credenciales bancarias directas de tu cuenta</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Public Key / Merchant ID (Pública)
            </label>
            <input
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="pk_test_... o ID de comercio"
              className="w-full text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Secret / Private Key (Cifrada AES-256)</span>
              <span className="text-[10px] text-teal-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> KMS Guard
              </span>
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_test_... o Clave privada"
              className="w-full text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 uppercase tracking-wider block">
              Webhook / Events Secret (Checksum)
            </label>
            <input
              type="password"
              value={eventsSecret}
              onChange={(e) => setEventsSecret(e.target.value)}
              placeholder="whsec_... o Events Secret de firma"
              className="w-full text-xs font-mono rounded-xl border border-slate-700 bg-slate-950 text-white px-3.5 py-2.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
            />
            <span className="text-[10px] text-slate-500 block">
              Requerido para validar firmas criptográficas y prevenir spoofing de pagos.
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Modo Sandbox / Pruebas</span>
                <span className="text-[11px] text-slate-400">Opera en entorno de simulación sin cobros reales</span>
              </div>
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                className="w-4 h-4 accent-teal-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Habilitar Pasarela</span>
                <span className="text-[11px] text-slate-400">Mostrar como opción disponible en el Checkout</span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5"
            >
              {saving ? "Cifrando..." : "Guardar Credenciales"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
