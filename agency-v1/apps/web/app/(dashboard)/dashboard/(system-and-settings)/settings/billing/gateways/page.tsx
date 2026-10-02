"use client";
import { useState, useEffect } from "react";

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
  logoText: string;
};

const providersList: ProviderInfo[] = [
  { id: "STRIPE", name: "Stripe", color: "bg-indigo-600", logoText: "S" },
  { id: "WOMPI", name: "Wompi", color: "bg-blue-800", logoText: "W" },
  { id: "MERCADOPAGO", name: "Mercado Pago", color: "bg-sky-400", logoText: "MP" },
  { id: "EPAYCO", name: "ePayco", color: "bg-orange-500", logoText: "eP" },
  { id: "PAYPAL", name: "PayPal", color: "bg-blue-600", logoText: "P" }
];

export default function GatewaysSettingsPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const res = await fetch("/api/payments/settings/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Refresh
        fetchGateways();
      } else {
        alert("Error al guardar la configuración.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al guardar.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans text-slate-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pasarelas de Pago</h1>
        <p className="text-gray-500">
          Conecta tus propias cuentas bancarias para procesar pagos (Bring Your Own Gateway). 
          Los datos se cifran con AES-256 de grado militar.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando pasarelas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providersList.map(provider => (
            <GatewayCard 
              key={provider.id} 
              provider={provider} 
              config={gateways.find(g => g.provider === provider.id)} 
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GatewayCard({ 
  provider, 
  config, 
  onSave 
}: { 
  provider: ProviderInfo; 
  config?: GatewayConfig; 
  onSave: (payload: GatewayConfig) => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isActive = config?.isActive || false;

  return (
    <>
      <div className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${provider.color}`}>
              {provider.logoText}
            </div>
            <h3 className="text-xl font-semibold">{provider.name}</h3>
          </div>
          <div>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Acepta pagos a través de {provider.name} directo a tu cuenta.
        </p>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Configurar
        </button>
      </div>

      {isModalOpen && (
        <GatewayModal 
          provider={provider} 
          config={config} 
          onClose={() => setIsModalOpen(false)} 
          onSave={async (payload) => {
            await onSave(payload);
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function GatewayModal({ 
  provider, 
  config, 
  onClose, 
  onSave 
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
      isTestMode
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Configurar {provider.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
            <input 
              type="text" 
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="pk_test_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret / Private Key</label>
            <input 
              type="password" 
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_test_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          {provider.id === 'WOMPI' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Events Secret (Webhooks)</label>
              <input 
                type="password" 
                value={eventsSecret}
                onChange={(e) => setEventsSecret(e.target.value)}
                placeholder="evt_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-700">Modo de Pruebas (Test Mode)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-700">Activo</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving ? 'Guardando...' : 'Guardar Credenciales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
