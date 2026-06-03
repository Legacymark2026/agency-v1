"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import gsap from "gsap";
import { 
  LayoutDashboard, ShoppingBag, Calendar, UserCog, Award, 
  Package, Clock, ArrowUpRight, Power, MapPin, CheckCircle, Save
} from "lucide-react";

// Mock initial orders
const MOCK_ORDERS = [
  {
    id: "GDN-49293",
    date: "15/05/2026",
    coffeeId: "ethiopia-yirgacheffe",
    coffeeName: "Ethiopia Yirgacheffe",
    grind: "Filtro (V60 / Chemex)",
    size: "250g",
    total: 24.00,
    status: "delivered", // delivered, shipping, pending
    tracking: "TRK-ETH98273"
  },
  {
    id: "GDN-50129",
    date: "01/06/2026",
    coffeeId: "colombia-huila",
    coffeeName: "Colombia Huila Supremo",
    grind: "Grano Entero",
    size: "500g",
    total: 39.60,
    status: "shipping",
    tracking: "TRK-COL10294"
  }
];

export default function UserDashboard() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("overview"); // overview, orders, subscription, settings
  const [user, setUser] = useState<{ name: string; email: string; points: number; registeredAt: string } | null>(null);
  const [sub, setSub] = useState<{ beans: string; frequency: string; status: string; nextDelivery: string } | null>(null);
  
  // Settings Form State
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [address, setAddress] = useState("Carrera 7 #45-12, Apto 402");
  const [city, setCity] = useState("Bogotá");
  const [showSuccess, setShowSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check session on mount
    const session = localStorage.getItem("goldneez_session");
    const currentUser = localStorage.getItem("goldneez_current_user");

    if (!session || !currentUser) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(currentUser);
      setUser(parsedUser);
      setProfileName(parsedUser.name);
      setProfileEmail(parsedUser.email);
    } catch (e) {
      router.push("/login");
      return;
    }

    // Load or initialize subscription
    const savedSub = localStorage.getItem("goldneez_subscription");
    if (savedSub) {
      try {
        setSub(JSON.parse(savedSub));
      } catch (e) {
        // ignore
      }
    } else {
      const initialSub = {
        beans: "signature-blend",
        frequency: "30",
        status: "active",
        nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      setSub(initialSub);
      localStorage.setItem("goldneez_subscription", JSON.stringify(initialSub));
    }
  }, []);

  // GSAP animation when changing tabs
  useEffect(() => {
    if (tabContentRef.current) {
      const content = tabContentRef.current.children[0];
      if (content) {
        gsap.killTweensOf(content);
        gsap.fromTo(
          content,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
        );
      }
    }
  }, [activeTab]);

  // Points bar progress animation on Overview tab mount
  useEffect(() => {
    if (activeTab === "overview" && user) {
      const bar = document.querySelector(".points-progress-bar");
      if (bar) {
        const targetPercent = Math.min(100, (user.points / 1000) * 100);
        gsap.fromTo(
          bar,
          { width: "0%" },
          { width: `${targetPercent}%`, duration: 1.2, ease: "power3.out" }
        );
      }
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    localStorage.removeItem("goldneez_session");
    localStorage.removeItem("goldneez_current_user");
    
    // Dispatch custom logout event for Header
    window.dispatchEvent(new Event("user-logout"));

    router.push("/");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !user) return;

    const updatedUser = { ...user, name: profileName, email: profileEmail };
    setUser(updatedUser);
    localStorage.setItem("goldneez_current_user", JSON.stringify(updatedUser));
    localStorage.setItem("goldneez_user", JSON.stringify(updatedUser));

    // Simulate save delay
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const toggleSubscription = () => {
    if (!sub) return;
    const newStatus = sub.status === "active" ? "paused" : "active";
    const updatedSub = { ...sub, status: newStatus };
    setSub(updatedSub);
    localStorage.setItem("goldneez_subscription", JSON.stringify(updatedSub));
  };

  const updateSubBeans = (beansId: string) => {
    if (!sub) return;
    const updatedSub = { ...sub, beans: beansId };
    setSub(updatedSub);
    localStorage.setItem("goldneez_subscription", JSON.stringify(updatedSub));
  };

  const updateSubFrequency = (freq: string) => {
    if (!sub) return;
    const updatedSub = { 
      ...sub, 
      frequency: freq,
      nextDelivery: new Date(Date.now() + parseInt(freq) * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    setSub(updatedSub);
    localStorage.setItem("goldneez_subscription", JSON.stringify(updatedSub));
  };

  if (!user || !sub) return null;

  return (
    <div 
      ref={containerRef}
      className="max-w-[1400px] mx-auto min-h-[75vh] flex flex-col md:flex-row gap-8 select-none"
    >
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col justify-between border border-aluminum/10 bg-black/40 backdrop-blur-md rounded-3xl p-6">
        <div className="flex flex-col gap-6">
          
          {/* User Brief */}
          <div className="flex items-center gap-3 border-b border-aluminum/10 pb-5">
            <div className="w-10 h-10 rounded-full bg-amber/15 border border-amber/30 text-amber flex items-center justify-center font-cinzel text-lg font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="font-cinzel text-aluminum text-sm font-bold truncate">
                {user.name}
              </h4>
              <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-widest block">
                {t("stats_status_gold")}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {[
              { id: "overview", label: t("tab_overview"), icon: LayoutDashboard },
              { id: "orders", label: t("tab_orders"), icon: ShoppingBag },
              { id: "subscription", label: t("tab_subscription"), icon: Calendar },
              { id: "settings", label: t("tab_settings"), icon: UserCog },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-quattrocento text-sm cursor-pointer transition-all border ${
                    activeTab === tab.id
                      ? "bg-amber border-amber text-black font-bold shadow-lg"
                      : "border-transparent text-aluminum-dark hover:text-aluminum hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="w-full mt-8 flex items-center gap-3 px-4 py-3 rounded-xl font-quattrocento text-sm text-aluminum-dark hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer"
        >
          <Power size={18} />
          {t("logout")}
        </button>
      </aside>

      {/* Main Panel Content Container */}
      <main 
        ref={tabContentRef}
        className="flex-1 border border-aluminum/10 bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8"
      >
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            
            {/* Header Greeting */}
            <div>
              <h2 className="font-cinzel text-amber text-3xl font-bold tracking-wide">
                {t("welcome", { name: user.name.split(" ")[0] })}
              </h2>
              <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                Disfruta de la mejor experiencia de café de especialidad personalizada para ti.
              </p>
            </div>

            {/* Overview Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Golden Points */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark">
                    {t("stats_points")}
                  </span>
                  <Award className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-amber text-3xl font-bold block">
                    {user.points}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    Club Oro • Canjeable
                  </span>
                </div>
              </div>

              {/* Pedidos */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark">
                    {t("stats_orders")}
                  </span>
                  <Package className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-aluminum text-3xl font-bold block">
                    {MOCK_ORDERS.length}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    1 en tránsito
                  </span>
                </div>
              </div>

              {/* Suscripción Status */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark">
                    {t("stats_status")}
                  </span>
                  <Calendar className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-aluminum text-lg font-bold truncate block">
                    {sub.status === "active" ? t("sub_status_active") : t("sub_status_paused")}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    {sub.frequency === "15" ? t("sub_frequency_15") : t("sub_frequency_30")}
                  </span>
                </div>
              </div>

            </div>

            {/* Loyalty Gauge */}
            <div className="border border-amber/10 bg-gradient-to-r from-amber/5 to-transparent rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h4 className="font-cinzel text-aluminum font-bold tracking-wide">
                    Próximo Café de Regalo
                  </h4>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-0.5">
                    Llega a 1,000 Golden Points para canjear una bolsa de café de especialidad de 250g.
                  </p>
                </div>
                <span className="font-cinzel text-amber text-sm font-bold bg-amber/10 border border-amber/20 px-3 py-1 rounded-lg">
                  {user.points} / 1000 Pts
                </span>
              </div>
              <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-aluminum/10">
                <div className="points-progress-bar bg-amber h-full w-0" />
              </div>
            </div>

            {/* Quick Activity Summary */}
            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
              <h4 className="font-cinzel text-aluminum font-bold tracking-wide mb-4">
                Envío de Suscripción en Camino
              </h4>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber/10 rounded-xl text-amber shrink-0 border border-amber/20 animate-pulse">
                  <Package size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-cinzel text-sm text-aluminum font-bold">
                      Colombia Huila Supremo (500g)
                    </span>
                    <span className="font-quattrocento text-xs text-amber font-medium">
                      En Reparto
                    </span>
                  </div>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-1 leading-normal">
                    Tu envío mensual está en manos de la transportadora. Número de seguimiento:{" "}
                    <span className="text-aluminum font-mono select-all">TRK-COL10294</span>.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("tab_orders")}
            </h3>

            <div className="flex flex-col gap-4">
              {MOCK_ORDERS.map((order) => (
                <div 
                  key={order.id}
                  className="border border-aluminum/10 bg-black/20 hover:border-amber/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-aluminum/5 border border-aluminum/10 text-aluminum-dark rounded-xl shrink-0">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-cinzel text-sm text-aluminum font-bold">
                          {order.coffeeName} ({order.size})
                        </span>
                        <span className="font-mono text-[10px] text-aluminum-dark">
                          {order.id}
                        </span>
                      </div>
                      <span className="font-quattrocento text-xs text-aluminum-dark/80 block mt-1">
                        Molienda: {order.grind} | Fecha: {order.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-aluminum/10 pt-3 sm:pt-0 gap-2">
                    <span className="font-cinzel text-amber text-lg font-bold">
                      ${order.total.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        order.status === "delivered" ? "bg-green-500" : "bg-amber animate-pulse"
                      }`} />
                      <span className="font-quattrocento text-xs text-aluminum-dark capitalize">
                        {order.status === "delivered" ? t("orders_status_delivered") : t("orders_status_shipping")}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "subscription" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("sub_title")}
            </h3>

            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Preferred Beans selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-2 font-medium">
                    {t("sub_beans")}
                  </span>
                  <select
                    value={sub.beans}
                    onChange={(e) => updateSubBeans(e.target.value)}
                    className="w-full bg-black border border-aluminum/10 focus:border-amber/50 rounded-xl px-4 py-3 text-sm font-quattrocento text-aluminum focus:outline-none cursor-pointer transition-all"
                  >
                    <option value="signature-blend">Goldneez Signature Blend</option>
                    <option value="ethiopia-yirgacheffe">Ethiopia Yirgacheffe</option>
                    <option value="colombia-huila">Colombia Huila Supremo</option>
                    <option value="brasil-cerrado">Brasil Cerrado Mineiro</option>
                    <option value="panama-geisha">Panama Geisha Reserve</option>
                  </select>
                </div>

                {/* Frequency selection */}
                <div>
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark block mb-2 font-medium">
                    {t("sub_frequency")}
                  </span>
                  <div className="flex gap-2">
                    {[
                      { val: "15", label: t("sub_frequency_15") },
                      { val: "30", label: t("sub_frequency_30") }
                    ].map((freq) => (
                      <button
                        key={freq.val}
                        onClick={() => updateSubFrequency(freq.val)}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-quattrocento border transition-all cursor-pointer ${
                          sub.frequency === freq.val
                            ? "bg-amber border-amber text-black font-bold shadow-md"
                            : "border-aluminum/10 bg-black/40 hover:border-aluminum/30 text-aluminum-dark hover:text-aluminum"
                        }`}
                      >
                        {freq.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Status and dates display */}
              <div className="border-t border-aluminum/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                    {t("sub_next_delivery")}
                  </span>
                  <span className="font-cinzel text-aluminum text-sm font-bold">
                    {sub.nextDelivery}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase tracking-wider block">
                      {t("sub_status")}
                    </span>
                    <span className={`font-cinzel text-xs font-bold uppercase ${
                      sub.status === "active" ? "text-green-500" : "text-red-400"
                    }`}>
                      {sub.status === "active" ? t("sub_status_active") : t("sub_status_paused")}
                    </span>
                  </div>

                  <button
                    onClick={toggleSubscription}
                    className={`px-4 py-2.5 rounded-xl text-xs font-quattrocento uppercase tracking-wider font-bold transition-all cursor-pointer border ${
                      sub.status === "active"
                        ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500"
                        : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500 hover:text-black hover:border-green-500"
                    }`}
                  >
                    {sub.status === "active" ? t("sub_btn_pause") : t("sub_btn_resume")}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("settings_title")}
            </h3>

            {showSuccess && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-quattrocento animate-fadeIn">
                <CheckCircle size={16} className="shrink-0" />
                <span>{t("settings_success")}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              
              {/* Profile Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3 px-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3 px-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
                    Dirección de Envío
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-aluminum-dark" size={16} />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3 pl-12 pr-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark mb-2 block font-medium">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3 px-4 text-sm font-quattrocento text-aluminum focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Save */}
              <div className="border-t border-aluminum/10 pt-5 mt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-amber hover:bg-amber-light text-black font-quattrocento uppercase tracking-widest text-xs font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(249,178,51,0.15)] flex items-center gap-2 cursor-pointer"
                >
                  <Save size={14} />
                  {t("settings_btn_save")}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  );
}
