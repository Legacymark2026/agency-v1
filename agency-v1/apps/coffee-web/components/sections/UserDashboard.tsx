"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import gsap from "gsap";
import { 
  LayoutDashboard, ShoppingBag, Calendar, UserCog, Award, 
  Package, Power, MapPin, CheckCircle, Save,
  CreditCard, Trash2, Heart, Gift, Users, BookOpen, Star, RefreshCw, 
  BarChart2, Check, Thermometer, Droplet, Coffee, Sparkles, ChevronRight, X
} from "lucide-react";
import { getMeAction, updateProfileAction, logoutUserAction } from "@/actions/auth";
import { getUserOrdersAction } from "@/actions/checkout";
import { getFlavorProfileAction, saveFlavorProfileAction } from "@/actions/flavor";
import { getPointsHistoryAction, redeemRewardAction, getMonthlyConsumptionAction } from "@/actions/rewards";
import { getReferralStatsAction, applyReferralCodeAction } from "@/actions/referrals";
import { getEventsAction, getBookingsAction, bookEventAction, cancelBookingAction } from "@/actions/events";
import { getShippingTrackingAction } from "@/actions/tracking";
import { getProductReviewsAction, submitReviewAction } from "@/actions/reviews";
import { getNotificationPrefsAction, updateNotificationPrefsAction } from "@/actions/notifications";
import { getPaymentMethodsAction, addPaymentMethodAction, deletePaymentMethodAction } from "@/actions/payments";

// Recompensas catálogo mock
const REWARDS_CATALOG = [
  { id: "rwd-001", title: "Bolsa de Café de Especialidad (250g)", cost: 1000, desc: "Canjea cualquier origen de nuestra carta en presentación de 250g." },
  { id: "rwd-002", title: "Mug de Cerámica Goldneez", cost: 800, desc: "Mug hecho a mano por artesanos locales con acabado dorado." },
  { id: "rwd-003", title: "Molino Manual Hario Slim", cost: 3000, desc: "Molino de muelas cerámicas portátil para una molienda fresca." },
  { id: "rwd-004", title: "Taller Privado de Barismo (1h)", cost: 5000, desc: "Clase uno a uno con nuestro Head Barista para perfeccionar tu filtrado." }
];

export default function UserDashboard() {
  const t = useTranslations("dashboard");
  const router = useRouter();

  // Navigation
  const [activeTab, setActiveTab] = useState("overview"); // overview, orders, subscription, rewards, referrals, education, events, settings

  // Global User Info
  const [user, setUser] = useState<{ id: string; name: string; email: string; points: number; registeredAt: string } | null>(null);
  const [sub, setSub] = useState<{ beans: string; frequency: string; status: string; nextDelivery: string } | null>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);

  // Modules State
  // 1. Flavor Profile
  const [flavorProfile, setFlavorProfile] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [quizAcidez, setQuizAcidez] = useState(3);
  const [quizCuerpo, setQuizCuerpo] = useState(3);
  const [quizNotas, setQuizNotas] = useState<string[]>([]);
  const [quizMetodo, setQuizMetodo] = useState("V60");
  const [quizResult, setQuizResult] = useState<string[]>([]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // 2. Loyalty Points & History
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [pointsTier, setPointsTier] = useState("Silver");
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // 3. Referrals
  const [referralCode, setReferralCode] = useState("");
  const [referredCount, setReferredCount] = useState(0);
  const [referralPointsEarned, setReferralPointsEarned] = useState(0);
  const [applyCodeVal, setApplyCodeVal] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState(false);

  // 4. Grind Calculator
  const [calcMethod, setCalcMethod] = useState("V60");
  const [calcGrams, setCalcGrams] = useState(20);

  // 5. Monthly Consumption
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  // 6. Notification Preferences
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifPedidos, setNotifPedidos] = useState(true);
  const [notifPuntos, setNotifPuntos] = useState(true);
  const [notifBoletines, setNotifBoletines] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);

  // 7. Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardBrand, setNewCardBrand] = useState("Visa");
  const [addingCard, setAddingCard] = useState(false);

  // 8. Shipping Tracking
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [trackingSteps, setTrackingSteps] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // 9. Product Reviews
  const [reviewOrder, setReviewOrder] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  // 10. Catas & Eventos
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // 11. Education Guides
  const [selectedGuide, setSelectedGuide] = useState("v60");

  // Profile Form Settings
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bogotá");
  const [showSuccess, setShowSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Carga inicial
  useEffect(() => {
    async function loadData() {
      const me = await getMeAction();
      if (!me) {
        localStorage.removeItem("goldneez_session");
        localStorage.removeItem("goldneez_current_user");
        router.push("/login");
        return;
      }

      setUser({
        id: me.id,
        name: me.name,
        email: me.email,
        points: me.points,
        registeredAt: me.registeredAt
      });
      setProfileName(me.name);
      setProfileEmail(me.email);
      if (me.address) {
        setAddress(me.address);
      }

      // Cargar órdenes
      const realOrders = await getUserOrdersAction();
      if (realOrders) {
        setOrdersList(realOrders);
      }

      // Cargar suscripción
      const savedSub = localStorage.getItem("goldneez_subscription");
      if (savedSub) {
        try {
          setSub(JSON.parse(savedSub));
        } catch (e) {}
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

      // Cargar otros módulos en background/paralelo
      // Perfil sabor
      getFlavorProfileAction().then((profile) => {
        if (profile) setFlavorProfile(profile);
      });

      // Puntos
      getPointsHistoryAction().then((data) => {
        if (data) {
          setPointsTier(data.tier);
          setPointsHistory(data.history);
          if (user) {
            setUser(prev => prev ? { ...prev, points: data.points } : null);
          }
        }
      });

      // Referidos
      getReferralStatsAction().then((stats) => {
        if (stats) {
          setReferralCode(stats.codigo);
          setReferredCount(stats.referredCount);
          setReferralPointsEarned(stats.pointsEarned);
        }
      });

      // Eventos
      getEventsAction().then(setEventsList);
      getBookingsAction().then(setBookingsList);

      // Notificaciones
      getNotificationPrefsAction().then((prefs) => {
        if (prefs) {
          setNotifPromos(prefs.promociones);
          setNotifPedidos(prefs.pedidos);
          setNotifPuntos(prefs.clubPuntos);
          setNotifBoletines(prefs.boletines);
        }
      });

      // Métodos de pago
      getPaymentMethodsAction().then(setPaymentMethods);

      // Consumo
      getMonthlyConsumptionAction().then(setMonthlyStats);
    }

    loadData();
  }, []);

  // Animaciones de pestañas
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

  // Animación barra de puntos en Overview
  useEffect(() => {
    if (activeTab === "overview" && user) {
      const bar = document.querySelector(".points-progress-bar");
      if (bar) {
        const nextMilestone = pointsTier === "Silver" ? 1000 : pointsTier === "Gold" ? 3000 : 5000;
        const targetPercent = Math.min(100, (user.points / nextMilestone) * 100);
        gsap.fromTo(
          bar,
          { width: "0%" },
          { width: `${targetPercent}%`, duration: 1.2, ease: "power3.out" }
        );
      }
    }
  }, [activeTab, user, pointsTier]);

  const handleLogout = async () => {
    await logoutUserAction();
    localStorage.removeItem("goldneez_session");
    localStorage.removeItem("goldneez_current_user");
    window.dispatchEvent(new Event("user-logout"));
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !user) return;

    const res = await updateProfileAction(profileName, profileEmail, address, city);
    if (res.error) {
      alert(res.error);
      return;
    }

    const updatedUser = { ...user, name: profileName, email: profileEmail };
    setUser(updatedUser);
    localStorage.setItem("goldneez_current_user", JSON.stringify(updatedUser));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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

  // 1. Lógica del Quiz de Sabor
  const handleSaveFlavorProfile = async () => {
    setSavingQuiz(true);
    const notasStr = quizNotas.join(", ");
    const res = await saveFlavorProfileAction(quizAcidez, quizCuerpo, notasStr, quizMetodo);
    setSavingQuiz(false);
    if (res.error) {
      alert(res.error);
    } else {
      setQuizResult(res.recommendations);
      setFlavorProfile({
        acidez: quizAcidez,
        cuerpo: quizCuerpo,
        notas: notasStr,
        metodoPreferido: quizMetodo,
        recomendaciones: res.recommendations.join(",")
      });
      setQuizStep(4);
    }
  };

  // 2. Canje de Recompensas
  const handleRedeem = async (reward: any) => {
    if (!user || user.points < reward.cost) {
      alert("No tienes suficientes puntos.");
      return;
    }
    if (!confirm(`¿Confirmas que deseas canjear "${reward.title}" por ${reward.cost} puntos?`)) {
      return;
    }

    setRedeeming(reward.id);
    const res = await redeemRewardAction(reward.cost, `Canje: ${reward.title}`);
    setRedeeming(null);

    if (res.error) {
      alert(res.error);
    } else {
      alert("¡Recompensa canjeada con éxito! Te enviaremos un correo con las instrucciones.");
      setUser(prev => prev ? { ...prev, points: res.points } : null);
      // Recargar historial
      const ptsData = await getPointsHistoryAction();
      if (ptsData) {
        setPointsHistory(ptsData.history);
        setPointsTier(ptsData.tier);
      }
    }
  };

  // 3. Aplicar código de referido
  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyCodeVal.trim()) return;

    setApplyingCode(true);
    setReferralError("");
    setReferralSuccess(false);

    const res = await applyReferralCodeAction(applyCodeVal);
    setApplyingCode(false);

    if (res.error) {
      setReferralError(res.error);
    } else {
      setReferralSuccess(true);
      setApplyCodeVal("");
      // Recargar perfil y puntos
      const me = await getMeAction();
      if (me && user) {
        setUser(prev => prev ? { ...prev, points: me.points } : null);
      }
      const ptsData = await getPointsHistoryAction();
      if (ptsData) {
        setPointsHistory(ptsData.history);
        setPointsTier(ptsData.tier);
      }
      // Recargar stats de referido
      const stats = await getReferralStatsAction();
      if (stats) {
        setReferralCode(stats.codigo);
        setReferredCount(stats.referredCount);
        setReferralPointsEarned(stats.pointsEarned);
      }
    }
  };

  // 4. Calculadora de Molienda ratios
  const calculateGrindProps = () => {
    let ratio = 15; // 1g café = 15g agua
    let grindSize = "Media";
    let temp = 92;
    let time = "3:00 min";

    switch(calcMethod) {
      case "Espresso":
        ratio = 2;
        grindSize = "Muy Fina (Grano de sal)";
        temp = 93;
        time = "25-30 seg";
        break;
      case "Italiana":
        ratio = 10;
        grindSize = "Fina (Arena fina)";
        temp = 94;
        time = "1:30 min";
        break;
      case "V60":
        ratio = 15;
        grindSize = "Media-Fina (Sal de mesa)";
        temp = 92;
        time = "3:00 min";
        break;
      case "Prensa":
        ratio = 16;
        grindSize = "Gruesa (Sal kosher)";
        temp = 95;
        time = "4:00 min";
        break;
      case "Aeropress":
        ratio = 12;
        grindSize = "Media (Azúcar morena)";
        temp = 88;
        time = "2:00 min";
        break;
    }

    return {
      water: Math.round(calcGrams * ratio),
      grindSize,
      temp,
      time
    };
  };

  // 5. Guardar preferencias de notificaciones
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifs(true);
    const res = await updateNotificationPrefsAction({
      promociones: notifPromos,
      pedidos: notifPedidos,
      clubPuntos: notifPuntos,
      boletines: notifBoletines
    });
    setSavingNotifs(false);
    if (res.success) {
      alert("Preferencias de correo guardadas correctamente.");
    } else {
      alert("Error al guardar preferencias.");
    }
  };

  // 6. Tarjetas de Pago
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newCardName || !newCardExpiry) return;

    setAddingCard(true);
    const ultimosCuatro = newCardNumber.replace(/\s/g, '').slice(-4);
    const res = await addPaymentMethodAction(newCardBrand, ultimosCuatro, newCardName);
    setAddingCard(false);

    if (res.success) {
      setNewCardNumber("");
      setNewCardName("");
      setNewCardExpiry("");
      // Recargar
      const cards = await getPaymentMethodsAction();
      setPaymentMethods(cards);
    } else {
      alert(res.error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("¿Deseas eliminar este método de pago?")) return;
    const res = await deletePaymentMethodAction(cardId);
    if (res.success) {
      setPaymentMethods(prev => prev.filter(c => c.id !== cardId));
    }
  };

  // 7. Visual Shipping Tracking
  const handleShowTracking = async (orderId: string) => {
    if (trackingOrder === orderId) {
      setTrackingOrder(null);
      return;
    }
    setLoadingTracking(true);
    setTrackingOrder(orderId);
    const res = await getShippingTrackingAction(orderId);
    setLoadingTracking(false);
    if (res && res.steps) {
      setTrackingSteps(res.steps);
    }
  };

  // 8. Enviar reseña
  const handleOpenReview = (order: any) => {
    setReviewOrder(order);
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;

    setSubmittingReview(true);
    const res = await submitReviewAction(
      reviewOrder.id,
      reviewOrder.coffeeId || "custom-blend",
      reviewOrder.coffeeName,
      reviewRating,
      reviewComment
    );
    setSubmittingReview(false);

    if (res.success) {
      setReviewedOrders(prev => ({ ...prev, [reviewOrder.id]: true }));
      setReviewOrder(null);
      alert("¡Gracias por tu opinión! Nos ayuda a mejorar.");
    } else {
      alert(res.error);
    }
  };

  // 9. Reservar eventos
  const handleBookEvent = async (evt: any) => {
    setBookingLoading(evt.id);
    const res = await bookEventAction(evt.id, evt.title, evt.date);
    setBookingLoading(null);

    if (res.error) {
      alert(res.error);
    } else {
      alert("¡Reserva confirmada con éxito! Te esperamos.");
      // Recargar
      const evts = await getEventsAction();
      const bks = await getBookingsAction();
      setEventsList(evts);
      setBookingsList(bks);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("¿Deseas cancelar esta reserva?")) return;
    const res = await cancelBookingAction(bookingId);
    if (res.success) {
      setBookingsList(prev => prev.filter(b => b.id !== bookingId));
      // Recargar aforos
      const evts = await getEventsAction();
      setEventsList(evts);
    }
  };

  if (!user || !sub) return null;

  const grindProps = calculateGrindProps();

  return (
    <div 
      ref={containerRef}
      className="max-w-[1400px] mx-auto min-h-[80vh] flex flex-col lg:flex-row gap-8 select-none"
    >
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between border border-aluminum/10 bg-black/40 backdrop-blur-md rounded-3xl p-6">
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
              <span className="font-quattrocento text-[10px] text-amber uppercase tracking-widest block font-bold">
                Club {pointsTier === "Silver" ? "Plata" : pointsTier === "Gold" ? "Oro" : "Platino"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: "overview", label: t("tab_overview"), icon: LayoutDashboard },
              { id: "orders", label: t("tab_orders"), icon: ShoppingBag },
              { id: "subscription", label: t("tab_subscription"), icon: Calendar },
              { id: "rewards", label: "Recompensas", icon: Award },
              { id: "referrals", label: "Referidos", icon: Users },
              { id: "education", label: "Guías de Café", icon: BookOpen },
              { id: "events", label: "Catas & Clases", icon: Calendar },
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
        className="flex-1 border border-aluminum/10 bg-black/40 backdrop-blur-md rounded-3xl p-6 sm:p-8 overflow-hidden"
      >
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-cinzel text-amber text-3xl font-bold tracking-wide">
                  {t("welcome", { name: user.name.split(" ")[0] })}
                </h2>
                <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                  Explora tus beneficios dorados, calcula la extracción perfecta de tu taza o personaliza tu perfil de sabor.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber/10 border border-amber/20 px-4 py-2 rounded-2xl shrink-0">
                <Sparkles size={16} className="text-amber" />
                <span className="font-cinzel text-amber text-xs font-bold uppercase tracking-wider">
                  Tier {pointsTier}
                </span>
              </div>
            </div>

            {/* Overview Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Golden Points */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark font-medium">
                    {t("stats_points")}
                  </span>
                  <Award className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-amber text-3xl font-bold block">
                    {user.points}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    Puntos Canjeables de Café
                  </span>
                </div>
              </div>

              {/* Pedidos */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark font-medium">
                    {t("stats_orders")}
                  </span>
                  <Package className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-aluminum text-3xl font-bold block">
                    {ordersList.length}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    {ordersList.some(o => o.status !== "delivered") ? "1 pedido en camino" : "Todos entregados"}
                  </span>
                </div>
              </div>

              {/* Suscripción Status */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-36">
                <div className="flex items-center justify-between">
                  <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark font-medium">
                    Suscripción
                  </span>
                  <Calendar className="text-amber" size={20} />
                </div>
                <div>
                  <span className="font-cinzel text-aluminum text-lg font-bold truncate block">
                    {sub.status === "active" ? t("sub_status_active") : t("sub_status_paused")}
                  </span>
                  <span className="font-quattrocento text-[10px] text-aluminum-dark mt-1 block">
                    {sub.beans.replace(/-/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>

            </div>

            {/* Loyalty Tier Progress Bar */}
            <div className="border border-amber/10 bg-gradient-to-r from-amber/5 to-transparent rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h4 className="font-cinzel text-aluminum font-bold tracking-wide">
                    {pointsTier === "Silver" ? "Camino a Miembro Oro" : pointsTier === "Gold" ? "Camino a Miembro Platino" : "Nivel Máximo Platino alcanzado"}
                  </h4>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-0.5">
                    {pointsTier === "Silver" 
                      ? "Consigue 1,000 puntos para ascender a Oro y desbloquear 15% de descuento en la tienda de especialidad." 
                      : pointsTier === "Gold" 
                      ? "Consigue 3,000 puntos para ascender a Platino, obteniendo invitaciones exclusivas a catas privadas y envíos gratis sin mínimo."
                      : "Disfrutas de envío gratuito ilimitado, 20% descuento constante y catas gratuitas."}
                  </p>
                </div>
                <span className="font-cinzel text-amber text-sm font-bold bg-amber/10 border border-amber/20 px-3 py-1 rounded-lg">
                  {user.points} / {pointsTier === "Silver" ? "1000" : pointsTier === "Gold" ? "3000" : "5000"} Pts
                </span>
              </div>
              <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-aluminum/10">
                <div className="points-progress-bar bg-amber h-full w-0" />
              </div>
            </div>

            {/* Sub-grid: Grind Calculator & Monthly Consumption chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Grind Calculator */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6 flex flex-col gap-5">
                <div>
                  <h4 className="font-cinzel text-aluminum font-bold tracking-wide flex items-center gap-2">
                    <Coffee size={18} className="text-amber" />
                    Calculadora de Molienda y Proporciones
                  </h4>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-0.5">
                    Ajusta la cantidad de café para obtener el agua, temperatura y molienda idóneas.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Método */}
                  <div>
                    <label className="font-quattrocento text-[10px] uppercase text-aluminum-dark font-bold tracking-wider block mb-2">
                      Método de Preparación
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {["Espresso", "Italiana", "V60", "Prensa", "Aeropress"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setCalcMethod(m)}
                          className={`py-2 text-[10px] font-bold font-quattrocento border rounded-lg transition-all cursor-pointer truncate ${
                            calcMethod === m 
                              ? "bg-amber border-amber text-black" 
                              : "border-aluminum/15 hover:border-aluminum/30 text-aluminum-dark"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cantidad de Café */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-quattrocento text-[10px] uppercase text-aluminum-dark font-bold tracking-wider">
                        Café Molido
                      </label>
                      <span className="font-cinzel text-amber text-xs font-bold">{calcGrams}g</span>
                    </div>
                    <input 
                      type="range" 
                      min="7" 
                      max="60" 
                      value={calcGrams} 
                      onChange={(e) => setCalcGrams(parseInt(e.target.value))}
                      className="w-full accent-amber cursor-pointer h-1.5 bg-black rounded-lg border border-aluminum/10"
                    />
                  </div>

                  {/* Resultados */}
                  <div className="bg-black/40 border border-aluminum/10 rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Droplet size={16} className="text-amber shrink-0" />
                      <div>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark block">Agua Recomendada</span>
                        <span className="font-cinzel text-aluminum text-xs font-bold">{grindProps.water} ml / g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer size={16} className="text-amber shrink-0" />
                      <div>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark block">Temperatura</span>
                        <span className="font-cinzel text-aluminum text-xs font-bold">{grindProps.temp}°C</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} className="text-amber shrink-0" />
                      <div>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark block">Molienda</span>
                        <span className="font-cinzel text-aluminum text-xs font-bold block truncate">{grindProps.grindSize}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber shrink-0" />
                      <div>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark block">Tiempo de Extracción</span>
                        <span className="font-cinzel text-aluminum text-xs font-bold">{grindProps.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Consumption Chart */}
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h4 className="font-cinzel text-aluminum font-bold tracking-wide flex items-center gap-2">
                    <BarChart2 size={18} className="text-amber" />
                    Mi Consumo Mensual (g)
                  </h4>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-0.5">
                    Seguimiento aproximado de café molido consumido este año.
                  </p>
                </div>

                <div className="flex-1 flex items-end justify-between gap-1.5 h-36 pt-4">
                  {monthlyStats.map((item, idx) => {
                    const maxVal = Math.max(...monthlyStats.map(s => s.grams), 1250);
                    const heightPercent = `${(item.grams / maxVal) * 100}%`;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full bg-amber/10 border-t-2 border-amber hover:bg-amber/30 rounded-t-sm group relative flex justify-center" style={{ height: heightPercent }}>
                          <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-amber text-black font-cinzel text-[10px] font-bold py-1 px-1.5 rounded shadow-lg transition-transform pointer-events-none whitespace-nowrap">
                            {item.grams}g
                          </span>
                        </div>
                        <span className="font-quattrocento text-[9px] text-aluminum-dark font-medium">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Taste Flavor Profile & Recommendations widget */}
            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber/10 border border-amber/20 rounded-2xl text-amber shrink-0">
                  <Heart size={22} />
                </div>
                <div>
                  <h4 className="font-cinzel text-aluminum text-base font-bold tracking-wide">
                    {flavorProfile ? "Mi Perfil de Sabor de Especialidad" : "Descubre tu Origen Ideal de Café"}
                  </h4>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-1 leading-relaxed max-w-[500px]">
                    {flavorProfile 
                      ? `Tu perfil prefiere café con Acidez (${flavorProfile.acidez}/5), Cuerpo (${flavorProfile.cuerpo}/5). Notas preferidas: ${flavorProfile.notas || 'No configurado'}. Métodos: ${flavorProfile.metodoPreferido}.`
                      : "Responde 3 breves preguntas sobre cómo tomas y disfrutas el café para que nuestro sumiller digital te recomiende tu origen idóneo."}
                  </p>
                  
                  {flavorProfile && flavorProfile.recomendaciones && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase font-bold tracking-wider">Origen Recomendado:</span>
                      {flavorProfile.recomendaciones.split(",").map((rec: string) => (
                        <span key={rec} className="font-cinzel text-[10px] text-amber bg-amber/10 border border-amber/20 px-2 py-0.5 rounded font-bold uppercase">
                          {rec.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizStep(1);
                  setQuizAcidez(3);
                  setQuizCuerpo(3);
                  setQuizNotas([]);
                  setShowQuiz(true);
                }}
                className="bg-amber hover:bg-amber-light text-black font-quattrocento text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 shadow-md shrink-0 self-stretch md:self-auto flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                {flavorProfile ? "Volver a Evaluar" : "Hacer Quiz"}
              </button>
            </div>

            {/* Quiz Flavor Quiz Overlay Dialog */}
            {showQuiz && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-[500px] bg-neutral-900 border border-aluminum/15 rounded-3xl p-6 relative flex flex-col gap-6 animate-fadeIn">
                  <button 
                    onClick={() => setShowQuiz(false)}
                    className="absolute right-4 top-4 text-aluminum-dark hover:text-aluminum cursor-pointer"
                  >
                    <X size={20} />
                  </button>

                  <div className="border-b border-aluminum/10 pb-4">
                    <span className="font-cinzel text-amber text-[10px] font-bold uppercase tracking-widest block">Coffee Taste Quiz</span>
                    <h3 className="font-cinzel text-aluminum text-xl font-bold mt-1">Descubridor de Café Ideal</h3>
                  </div>

                  {/* Step 1: Acidez y Cuerpo */}
                  {quizStep === 1 && (
                    <div className="flex flex-col gap-5">
                      <span className="font-quattrocento text-xs text-aluminum-dark">Paso 1 de 3 • Ajusta las intensidades sensoriales que buscas.</span>
                      
                      {/* Acidez */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-quattrocento text-aluminum font-bold">Acidez Cítrica Brillante</label>
                          <span className="font-cinzel text-amber font-bold">{quizAcidez}/5</span>
                        </div>
                        <input 
                          type="range" min="1" max="5" value={quizAcidez} onChange={(e) => setQuizAcidez(parseInt(e.target.value))}
                          className="accent-amber cursor-pointer h-1.5 bg-black border border-aluminum/10 rounded-lg"
                        />
                        <span className="text-[10px] font-quattrocento text-aluminum-dark">1 (Baja/Achocolatado) • 5 (Alta/Frutal-Cítrico)</span>
                      </div>

                      {/* Cuerpo */}
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-quattrocento text-aluminum font-bold">Cuerpo / Densidad en Boca</label>
                          <span className="font-cinzel text-amber font-bold">{quizCuerpo}/5</span>
                        </div>
                        <input 
                          type="range" min="1" max="5" value={quizCuerpo} onChange={(e) => setQuizCuerpo(parseInt(e.target.value))}
                          className="accent-amber cursor-pointer h-1.5 bg-black border border-aluminum/10 rounded-lg"
                        />
                        <span className="text-[10px] font-quattrocento text-aluminum-dark">1 (Té ligero/Delicado) • 5 (Denso/Cremoso)</span>
                      </div>

                      <button
                        onClick={() => setQuizStep(2)}
                        className="mt-4 bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer"
                      >
                        Siguiente Paso
                      </button>
                    </div>
                  )}

                  {/* Step 2: Notas de Cata */}
                  {quizStep === 2 && (
                    <div className="flex flex-col gap-5">
                      <span className="font-quattrocento text-xs text-aluminum-dark">Paso 2 de 3 • Selecciona tus notas y descriptores favoritos (selecciona varias).</span>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        {["Chocolate", "Caramelo", "Floral", "Cítrico", "Frutos Rojos", "Nuez", "Especias", "Vainilla"].map((nota) => {
                          const active = quizNotas.includes(nota);
                          return (
                            <button
                              key={nota}
                              onClick={() => {
                                setQuizNotas(prev => active ? prev.filter(n => n !== nota) : [...prev, nota]);
                              }}
                              className={`py-2 px-3 border text-xs font-quattrocento font-medium rounded-xl cursor-pointer transition-all ${
                                active ? "bg-amber border-amber text-black" : "border-aluminum/10 hover:border-aluminum/35 text-aluminum-dark"
                              }`}
                            >
                              {nota}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => setQuizStep(1)}
                          className="flex-1 border border-aluminum/15 text-aluminum-dark font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={() => setQuizStep(3)}
                          className="flex-1 bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer"
                        >
                          Siguiente Paso
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Método preferido */}
                  {quizStep === 3 && (
                    <div className="flex flex-col gap-5">
                      <span className="font-quattrocento text-xs text-aluminum-dark">Paso 3 de 3 • Selecciona tu cafetera de cabecera.</span>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {["Espresso", "Prensa Francesa", "Goteo / V60 / Chemex", "Moka / Italiana", "Aeropress"].map((met) => {
                          const active = quizMetodo === met;
                          return (
                            <button
                              key={met}
                              onClick={() => setQuizMetodo(met)}
                              className={`py-2.5 px-4 border text-left text-xs font-quattrocento font-bold rounded-xl cursor-pointer transition-all ${
                                active ? "bg-amber border-amber text-black" : "border-aluminum/10 hover:border-aluminum/35 text-aluminum-dark"
                              }`}
                            >
                              {met}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => setQuizStep(2)}
                          className="flex-1 border border-aluminum/15 text-aluminum-dark font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={handleSaveFlavorProfile}
                          disabled={savingQuiz}
                          className="flex-1 bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer flex items-center justify-center gap-2"
                        >
                          {savingQuiz ? "Procesando..." : "Calcular Perfil"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Resultado */}
                  {quizStep === 4 && (
                    <div className="flex flex-col items-center text-center gap-5">
                      <div className="w-12 h-12 bg-amber/15 border border-amber/30 text-amber rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <span className="font-quattrocento text-xs text-aluminum-dark uppercase font-bold tracking-widest">Resultado de Cata</span>
                        <h4 className="font-cinzel text-aluminum text-lg font-bold mt-1">¡Perfil Calculado Exitosamente!</h4>
                        <p className="font-quattrocento text-xs text-aluminum-dark mt-2">
                          Basado en tu preferencia por la {quizAcidez >= 4 ? "alta acidez frutal" : "dulzura achocolatada"} y {quizCuerpo >= 4 ? "cuerpo robusto" : "cuerpo ligero y sedoso"}, tu café ideal es:
                        </p>
                      </div>

                      <div className="bg-black/50 border border-amber/20 px-6 py-4 rounded-2xl my-2">
                        {quizResult.map((res: string) => (
                          <span key={res} className="font-cinzel text-amber text-xl font-bold uppercase tracking-wide block mb-1">
                            {res.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setShowQuiz(false);
                          router.push("/productos");
                        }}
                        className="w-full bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer"
                      >
                        Ver Cafés en la Tienda
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

        {/* 2. ORDERS TAB (WITH TRACKING AND REVIEWS) */}
        {activeTab === "orders" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("tab_orders")}
            </h3>

            <div className="flex flex-col gap-4">
              {ordersList.length > 0 ? (
                ordersList.map((order) => {
                  const isReviewed = reviewedOrders[order.id];
                  return (
                    <div 
                      key={order.id}
                      className="border border-aluminum/10 bg-black/20 hover:border-amber/10 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-aluminum/5 border border-aluminum/10 text-aluminum-dark rounded-xl shrink-0">
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-cinzel text-sm text-aluminum font-bold">
                                {order.coffeeName} ({order.size})
                              </span>
                              <span className="font-mono text-[10px] text-aluminum-dark bg-aluminum/5 px-2 py-0.5 rounded">
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

                      {/* Botones de acción del pedido */}
                      <div className="flex items-center gap-3 border-t border-aluminum/5 pt-4">
                        <button
                          onClick={() => handleShowTracking(order.id)}
                          className="px-4 py-2 border border-aluminum/15 hover:border-amber/30 text-aluminum hover:text-amber font-quattrocento text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2"
                        >
                          <Package size={14} />
                          {trackingOrder === order.id ? "Ocultar Seguimiento" : "Seguimiento Visual"}
                        </button>

                        {order.status === "delivered" && (
                          <button
                            onClick={() => handleOpenReview(order)}
                            disabled={isReviewed}
                            className={`px-4 py-2 border font-quattrocento text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
                              isReviewed 
                                ? "border-green-500/20 bg-green-500/5 text-green-400 cursor-not-allowed" 
                                : "border-aluminum/15 hover:border-amber/30 text-aluminum hover:text-amber"
                            }`}
                          >
                            <Star size={14} />
                            {isReviewed ? "Reseña Enviada ✓" : "Dejar Reseña"}
                          </button>
                        )}
                      </div>

                      {/* Módulo de Seguimiento Visual Expandible */}
                      {trackingOrder === order.id && (
                        <div className="border border-aluminum/10 bg-black/40 rounded-xl p-5 mt-2 animate-fadeIn flex flex-col gap-4">
                          <h5 className="font-cinzel text-xs font-bold text-aluminum tracking-wider uppercase">Estado de Envío del Pedido</h5>
                          {loadingTracking ? (
                            <span className="font-quattrocento text-xs text-aluminum-dark">Cargando pasos...</span>
                          ) : (
                            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                              {trackingSteps.map((step, idx) => (
                                <div key={idx} className="flex-1 flex flex-row md:flex-col items-center gap-3 relative w-full">
                                  {/* Línea conectora */}
                                  {idx < trackingSteps.length - 1 && (
                                    <div className="absolute left-[13px] top-6 w-[2px] h-10 md:left-7 md:top-3.5 md:w-full md:h-[2px] bg-aluminum/10 z-0">
                                      <div className={`h-full bg-amber transition-all duration-500 ${
                                        step.status === "completed" ? "w-full" : "w-0"
                                      }`} />
                                    </div>
                                  )}

                                  {/* Icono del Step */}
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 border transition-all ${
                                    step.status === "completed" 
                                      ? "bg-amber border-amber text-black" 
                                      : step.status === "current"
                                      ? "bg-neutral-800 border-amber text-amber animate-pulse"
                                      : "bg-neutral-900 border-aluminum/20 text-aluminum-dark"
                                  }`}>
                                    {step.status === "completed" ? <Check size={14} /> : idx + 1}
                                  </div>

                                  {/* Texto */}
                                  <div className="flex flex-col md:items-center md:text-center shrink-0">
                                    <span className={`font-cinzel text-xs font-bold ${
                                      step.status === "upcoming" ? "text-aluminum-dark" : "text-aluminum"
                                    }`}>
                                      {step.label}
                                    </span>
                                    <span className="font-quattrocento text-[10px] text-aluminum-dark">
                                      {step.date}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-aluminum/10 rounded-2xl">
                  <p className="font-quattrocento text-sm text-aluminum-dark">No tienes pedidos registrados todavía.</p>
                </div>
              )}
            </div>

            {/* Modal de Reseña */}
            {reviewOrder && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleSendReview} className="w-full max-w-[450px] bg-neutral-900 border border-aluminum/15 rounded-3xl p-6 relative flex flex-col gap-5 animate-fadeIn">
                  <button 
                    type="button"
                    onClick={() => setReviewOrder(null)}
                    className="absolute right-4 top-4 text-aluminum-dark hover:text-aluminum cursor-pointer"
                  >
                    <X size={20} />
                  </button>

                  <div>
                    <span className="font-cinzel text-amber text-[10px] font-bold uppercase tracking-widest block">Reseña de Producto</span>
                    <h4 className="font-cinzel text-aluminum text-base font-bold mt-1">Calificar {reviewOrder.coffeeName}</h4>
                  </div>

                  {/* Stars selector */}
                  <div className="flex flex-col gap-2 items-center py-2">
                    <span className="font-quattrocento text-[10px] uppercase text-aluminum-dark font-bold tracking-wider">Tu Calificación</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-amber hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star size={32} fill={star <= reviewRating ? "#F9B233" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="font-quattrocento text-[10px] uppercase text-aluminum-dark font-bold tracking-wider mb-2">Comentario de Cata</label>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Comparte tu experiencia sensorial: aroma, acidez, cuerpo y notas de cata..."
                      className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3 px-4 text-xs font-quattrocento text-aluminum focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingReview ? "Enviando..." : "Publicar Reseña"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 3. SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div>
            <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide mb-6">
              {t("sub_title")}
            </h3>

            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
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

        {/* 4. REWARDS TAB (Recompensas & Canje + Historial de Puntos) */}
        {activeTab === "rewards" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide">
                Recompensas & Canje
              </h3>
              <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                Utiliza tus Golden Points acumulados para canjear productos de especialidad y experiencias baristas.
              </p>
            </div>

            {/* Points balance display */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-amber/15 bg-amber/5 rounded-3xl gap-4">
              <div>
                <span className="font-quattrocento text-[10px] uppercase text-aluminum-dark tracking-widest font-bold">Balance de Puntos</span>
                <span className="font-cinzel text-amber text-3xl font-bold block mt-1">{user.points} Puntos</span>
              </div>
              <div className="flex gap-2">
                <span className="font-quattrocento text-xs text-aluminum-dark font-medium">Categoría actual:</span>
                <span className="font-cinzel text-amber text-xs font-bold uppercase">{pointsTier}</span>
              </div>
            </div>

            {/* Rewards grid */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Catálogo de Premios</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REWARDS_CATALOG.map((reward) => {
                  const canRedeem = user.points >= reward.cost;
                  return (
                    <div 
                      key={reward.id} 
                      className={`border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:border-amber/10 ${
                        !canRedeem ? "opacity-75" : ""
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h5 className="font-cinzel text-sm text-aluminum font-bold leading-snug">{reward.title}</h5>
                          <span className="font-cinzel text-amber text-xs font-bold bg-amber/10 border border-amber/20 px-2.5 py-1 rounded-lg shrink-0">
                            {reward.cost} Pts
                          </span>
                        </div>
                        <p className="font-quattrocento text-xs text-aluminum-dark mt-2 leading-relaxed">
                          {reward.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem || redeeming === reward.id}
                        className={`w-full py-2.5 rounded-xl font-quattrocento text-xs font-bold uppercase tracking-widest cursor-pointer transition-all ${
                          canRedeem 
                            ? "bg-amber text-black hover:bg-amber-light" 
                            : "bg-neutral-800 text-aluminum-dark border border-aluminum/10 cursor-not-allowed"
                        }`}
                      >
                        {redeeming === reward.id ? "Procesando..." : canRedeem ? "Canjear Premio" : "Faltan Puntos"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Points Timeline History */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Historial de Puntos</h4>
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl overflow-hidden">
                {pointsHistory.length > 0 ? (
                  <div className="divide-y divide-aluminum/5">
                    {pointsHistory.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-4 hover:bg-white/2 transition-colors">
                        <div>
                          <span className="font-cinzel text-xs text-aluminum font-bold block">{log.concepto}</span>
                          <span className="font-quattrocento text-[10px] text-aluminum-dark">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`font-cinzel text-sm font-bold ${
                          log.puntos > 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {log.puntos > 0 ? `+${log.puntos}` : log.puntos}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="font-quattrocento text-xs text-aluminum-dark">No hay movimientos registrados.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 5. REFERRALS TAB */}
        {activeTab === "referrals" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide">
                Programa de Referidos
              </h3>
              <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                Invita a tus amigos amantes del café. Ambos ganan puntos de especialidad al registrarse.
              </p>
            </div>

            {/* Referrals Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-28">
                <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark font-medium">
                  Amigos Registrados
                </span>
                <span className="font-cinzel text-aluminum text-3xl font-bold block">
                  {referredCount}
                </span>
              </div>
              <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col justify-between h-28">
                <span className="font-quattrocento text-xs uppercase tracking-wider text-aluminum-dark font-medium">
                  Puntos Acumulados
                </span>
                <span className="font-cinzel text-amber text-3xl font-bold block">
                  +{referralPointsEarned} Pts
                </span>
              </div>
            </div>

            {/* Share Code Card */}
            <div className="border border-amber/10 bg-gradient-to-r from-amber/5 to-transparent rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h4 className="font-cinzel text-aluminum font-bold tracking-wide">Mi Código de Invitación</h4>
                <p className="font-quattrocento text-xs text-aluminum-dark mt-1">
                  Comparte este código con tus amigos para regalarles 100 puntos. Al realizar su primera compra, tú recibirás 200 puntos.
                </p>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                <div className="bg-black/60 border border-amber/30 text-amber font-mono font-bold text-lg tracking-widest px-5 py-3 rounded-xl select-all text-center flex-1 sm:flex-none">
                  {referralCode || "CARGANDO..."}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    alert("Código copiado al portapapeles.");
                  }}
                  className="bg-amber hover:bg-amber-light text-black p-3.5 rounded-xl cursor-pointer transition-all"
                >
                  Copiar
                </button>
              </div>
            </div>

            {/* Apply Referral Code */}
            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
              <h4 className="font-cinzel text-aluminum font-bold tracking-wide mb-4">¿Te ha invitado un amigo?</h4>
              
              {referralSuccess && (
                <div className="mb-4 flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-quattrocento animate-fadeIn">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>¡Código aplicado correctamente! Se han sumado 100 puntos a tu balance.</span>
                </div>
              )}

              {referralError && (
                <div className="mb-4 flex items-center gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-red-400 text-xs font-quattrocento animate-fadeIn">
                  <X size={16} className="shrink-0" />
                  <span>{referralError}</span>
                </div>
              )}

              <form onSubmit={handleApplyReferral} className="flex gap-3 max-w-[450px]">
                <input
                  type="text"
                  placeholder="Introduce el código GOLD-XXXXXX"
                  value={applyCodeVal}
                  onChange={(e) => setApplyCodeVal(e.target.value)}
                  className="flex-1 bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-3.5 px-4 text-xs font-quattrocento text-aluminum focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={applyingCode || !applyCodeVal.trim()}
                  className="bg-amber hover:bg-amber-light disabled:opacity-50 text-black font-quattrocento text-xs font-bold uppercase tracking-widest px-6 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center"
                >
                  {applyingCode ? "Aplicando..." : "Aplicar"}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* 6. EDUCATION TAB */}
        {activeTab === "education" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide">
                Guías de Café & Educación
              </h3>
              <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                Domina el arte del café en casa. Ratios, temperaturas y tiempos de extracción paso a paso.
              </p>
            </div>

            {/* Guide selector */}
            <div className="flex gap-3 border-b border-aluminum/10 pb-4">
              {[
                { id: "v60", label: "Filtro V60" },
                { id: "french", label: "Prensa Francesa" },
                { id: "chemex", label: "Chemex" }
              ].map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setSelectedGuide(guide.id)}
                  className={`font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer pb-2 relative transition-all ${
                    selectedGuide === guide.id ? "text-amber" : "text-aluminum-dark hover:text-aluminum"
                  }`}
                >
                  {guide.label}
                  {selectedGuide === guide.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber animate-fadeIn" />
                  )}
                </button>
              ))}
            </div>

            {/* Guide content */}
            <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-6">
              {selectedGuide === "v60" && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-cinzel text-aluminum font-bold text-base">La Extracción Perfecta en V60</h4>
                  <div className="grid grid-cols-3 gap-4 border-y border-aluminum/5 py-4 my-2">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Proporción (Ratio)</span>
                      <span className="font-cinzel text-amber text-sm font-bold">1:15 (15g café por 225g agua)</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Temperatura</span>
                      <span className="font-cinzel text-amber text-sm font-bold">92°C - 94°C</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Molienda</span>
                      <span className="font-cinzel text-amber text-sm font-bold">Media-Fina (Sal fina)</span>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside font-quattrocento text-xs text-aluminum-dark flex flex-col gap-2.5 mt-2 leading-relaxed">
                    <li>Coloca el filtro de papel en el cono V60 y enjuágalo con agua caliente para eliminar sabores residuales y precalentar el cono.</li>
                    <li>Agrega el café molido (15g), nivélalo y haz un pequeño pozo en el centro.</li>
                    <li>**Preinfusión:** Vierte 40g de agua y espera 30-40 segundos para liberar el CO2 (verás burbujas o floración).</li>
                    <li>Vierte agua en espirales concéntricas desde el centro hacia afuera, evitando tocar el papel de filtro directo. Hazlo en 3 vertidos sucesivos hasta llegar a 225g.</li>
                    <li>Deja filtrar completamente. El proceso total debe durar entre 2:45 y 3:15 minutos.</li>
                  </ol>
                </div>
              )}

              {selectedGuide === "french" && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-cinzel text-aluminum font-bold text-base">Infusión con Prensa Francesa</h4>
                  <div className="grid grid-cols-3 gap-4 border-y border-aluminum/5 py-4 my-2">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Proporción (Ratio)</span>
                      <span className="font-cinzel text-amber text-sm font-bold">1:16 (20g café por 320g agua)</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Temperatura</span>
                      <span className="font-cinzel text-amber text-sm font-bold">94°C - 96°C</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Molienda</span>
                      <span className="font-cinzel text-amber text-sm font-bold">Gruesa (Sal Kosher)</span>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside font-quattrocento text-xs text-aluminum-dark flex flex-col gap-2.5 mt-2 leading-relaxed">
                    <li>Precalienta la prensa con agua caliente, luego descártala. Agrega el café molido grueso (20g).</li>
                    <li>Vierte la totalidad del agua caliente (320g) asegurando mojar todo el café molido uniformemente.</li>
                    <li>Coloca la tapa con el émbolo arriba y deja reposar 4:00 minutos exactos.</li>
                    <li>A los 4:00, con una cuchara rompe la costra superficial de café y retira la espuma del tope.</li>
                    <li>Baja el émbolo muy lentamente con una presión constante. Si está muy duro, la molienda fue muy fina.</li>
                    <li>Sirve de inmediato en tazas para detener la infusión y evitar sobre-extracción amarga.</li>
                  </ol>
                </div>
              )}

              {selectedGuide === "chemex" && (
                <div className="flex flex-col gap-4">
                  <h4 className="font-cinzel text-aluminum font-bold text-base">Elegancia y Claridad con Chemex</h4>
                  <div className="grid grid-cols-3 gap-4 border-y border-aluminum/5 py-4 my-2">
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Proporción (Ratio)</span>
                      <span className="font-cinzel text-amber text-sm font-bold">1:15 (30g café por 450g agua)</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Temperatura</span>
                      <span className="font-cinzel text-amber text-sm font-bold">92°C - 94°C</span>
                    </div>
                    <div>
                      <span className="font-quattrocento text-[10px] text-aluminum-dark uppercase block">Molienda</span>
                      <span className="font-cinzel text-amber text-sm font-bold">Media-Gruesa (Arena gruesa)</span>
                    </div>
                  </div>
                  <ol className="list-decimal list-inside font-quattrocento text-xs text-aluminum-dark flex flex-col gap-2.5 mt-2 leading-relaxed">
                    <li>Coloca el filtro Chemex de triple capa de forma que el pliegue triple quede del lado de la boquilla de vertido. Enjuaga con agua caliente.</li>
                    <li>Agrega el café molido medio-grueso (30g) y nivela.</li>
                    <li>**Preinfusión:** Agrega 60g de agua y espera 45 segundos para liberar los gases atrapados.</li>
                    <li>Vierte en círculos concéntricos lentos. Realiza vertidos de 100g progresivos hasta llegar a 450g de agua.</li>
                    <li>Deja gotear completamente. La molienda gruesa y el papel grueso darán una taza limpia de aceites.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Coffee Articles */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Artículos del Barista</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5">
                  <span className="font-cinzel text-[10px] text-amber font-bold uppercase tracking-wider block">Conservación</span>
                  <h5 className="font-cinzel text-sm text-aluminum font-bold mt-1">Cómo guardar tus granos dorados</h5>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-2 leading-relaxed">
                    Nunca congeles tu café de especialidad. La humedad rompe los aceites esenciales aromáticos. Guárdalo siempre en su bolsa con válvula hermética en un armario seco y fresco.
                  </p>
                </div>
                <div className="border border-aluminum/10 bg-black/20 rounded-2xl p-5">
                  <span className="font-cinzel text-[10px] text-amber font-bold uppercase tracking-wider block">Orígenes</span>
                  <h5 className="font-cinzel text-sm text-aluminum font-bold mt-1">¿Qué influye en la altitud de cultivo?</h5>
                  <p className="font-quattrocento text-xs text-aluminum-dark mt-2 leading-relaxed">
                    A mayor altitud, las temperaturas son menores, provocando que la cereza del café madure lentamente. Esto da como resultado granos de mayor densidad y acidez cítrica brillante.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 7. EVENTS & CALENDAR TAB */}
        {activeTab === "events" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-cinzel text-amber text-2xl font-bold tracking-wide">
                Catas & Eventos de Especialidad
              </h3>
              <p className="font-quattrocento text-sm text-aluminum-dark mt-1">
                Reserva tu cupo presencial en nuestros talleres y experiencias de cata guiadas por baristas certificados.
              </p>
            </div>

            {/* Bookings List */}
            {bookingsList.length > 0 && (
              <div>
                <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Mis Reservaciones</h4>
                <div className="flex flex-col gap-4">
                  {bookingsList.map((bk) => (
                    <div key={bk.id} className="border border-amber/15 bg-amber/5 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h5 className="font-cinzel text-sm text-aluminum font-bold">{bk.eventTitle}</h5>
                        <span className="font-quattrocento text-xs text-aluminum-dark block mt-1">Fecha reservada: {bk.eventDate}</span>
                      </div>
                      <button
                        onClick={() => handleCancelBooking(bk.id)}
                        className="px-4 py-2 border border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-black hover:border-red-500 font-quattrocento text-xs rounded-xl cursor-pointer transition-all"
                      >
                        Cancelar Reserva
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming events calendar list */}
            <div>
              <h4 className="font-cinzel text-aluminum text-base font-bold mb-4 tracking-wide uppercase">Calendario de Actividades</h4>
              <div className="flex flex-col gap-4">
                {eventsList.map((evt) => {
                  const hasBooked = bookingsList.some(b => b.eventId === evt.id);
                  return (
                    <div 
                      key={evt.id} 
                      className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-amber/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h5 className="font-cinzel text-sm text-aluminum font-bold">{evt.title}</h5>
                          <span className={`text-[10px] font-cinzel font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            evt.spotsLeft <= 2 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                          }`}>
                            {evt.spotsLeft === 0 ? "Agotado" : `${evt.spotsLeft} cupos libres`}
                          </span>
                        </div>
                        <p className="font-quattrocento text-xs text-aluminum-dark mt-2 leading-relaxed">
                          {evt.desc}
                        </p>
                        <span className="font-quattrocento text-[10px] text-aluminum-dark/80 font-bold block mt-3">
                          Fecha: {evt.date} | Hora: {evt.time}
                        </span>
                      </div>

                      <button
                        onClick={() => handleBookEvent(evt)}
                        disabled={evt.spotsLeft === 0 || hasBooked || bookingLoading === evt.id}
                        className={`px-5 py-2.5 rounded-xl font-quattrocento text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                          hasBooked 
                            ? "bg-green-500/10 border border-green-500/20 text-green-400 cursor-default" 
                            : evt.spotsLeft === 0 
                            ? "bg-neutral-800 text-aluminum-dark border border-aluminum/10 cursor-not-allowed" 
                            : "bg-amber text-black hover:bg-amber-light"
                        }`}
                      >
                        {bookingLoading === evt.id 
                          ? "Reservando..." 
                          : hasBooked 
                          ? "Reservado ✓" 
                          : evt.spotsLeft === 0 
                          ? "Agotado" 
                          : "Reservar Cupo"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 8. SETTINGS TAB (EXTENDED WITH NOTIFICATIONS AND PAYMENT METHODS) */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-8">
            
            {/* Profile Section */}
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

                <div className="border-t border-aluminum/10 pt-5 mt-2 flex justify-end">
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

            {/* Notification Preferences Section */}
            <div className="border-t border-aluminum/10 pt-8">
              <h4 className="font-cinzel text-aluminum text-lg font-bold mb-4 tracking-wide uppercase">Notificaciones de Correo</h4>
              <form onSubmit={handleSaveNotifications} className="flex flex-col gap-4">
                {[
                  { label: "Promociones y lanzamientos", desc: "Alertas sobre nuevos microlotes de café de especialidad.", state: notifPromos, setState: setNotifPromos },
                  { label: "Alertas de envío de pedidos", desc: "Notificaciones del progreso y tracking de tus despachos.", state: notifPedidos, setState: setNotifPedidos },
                  { label: "Movimientos de puntos de lealtad", desc: "Ganancia de puntos por compras y alertas de canje.", state: notifPuntos, setState: setNotifPuntos },
                  { label: "Boletín informativo Barista", desc: "Recetas mensuales, secretos de tostión e historias de origen.", state: notifBoletines, setState: setNotifBoletines }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-6 py-2 border-b border-aluminum/5">
                    <div>
                      <span className="font-cinzel text-sm text-aluminum font-bold block">{item.label}</span>
                      <span className="font-quattrocento text-xs text-aluminum-dark block mt-0.5">{item.desc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.setState(prev => !prev)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        item.state ? "bg-amber" : "bg-neutral-800 border border-aluminum/10"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-transform ${
                        item.state ? "translate-x-6 bg-black" : "translate-x-0 bg-aluminum-dark"
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={savingNotifs}
                    className="bg-amber hover:bg-amber-light text-black font-quattrocento uppercase tracking-widest text-xs font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={14} />
                    {savingNotifs ? "Guardando..." : "Guardar Preferencias"}
                  </button>
                </div>
              </form>
            </div>

            {/* Payment Methods Section */}
            <div className="border-t border-aluminum/10 pt-8">
              <h4 className="font-cinzel text-aluminum text-lg font-bold mb-4 tracking-wide uppercase">Métodos de Pago Guardados</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List Cards */}
                <div className="flex flex-col gap-4">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((card) => (
                      <div key={card.id} className="border border-aluminum/15 bg-black/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CreditCard size={20} className="text-amber shrink-0" />
                          <div>
                            <span className="font-cinzel text-xs text-aluminum font-bold block">
                              {card.marca} •••• {card.ultimosCuatro}
                            </span>
                            <span className="font-quattrocento text-[10px] text-aluminum-dark block mt-0.5">
                              Titular: {card.nombreTarjeta} {card.esPredeterminada ? " (Predeterminada)" : ""}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-aluminum-dark hover:text-red-400 p-2 cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="font-quattrocento text-xs text-aluminum-dark py-4 block">No tienes tarjetas guardadas.</span>
                  )}
                </div>

                {/* Add Card Form */}
                <form onSubmit={handleAddCard} className="border border-aluminum/10 bg-black/20 rounded-2xl p-5 flex flex-col gap-4">
                  <h5 className="font-cinzel text-xs font-bold text-aluminum tracking-wider uppercase">Agregar Tarjeta</h5>
                  
                  <div className="flex flex-col gap-3">
                    {/* Brand */}
                    <div className="flex gap-2">
                      {["Visa", "Mastercard", "Amex"].map((br) => (
                        <button
                          key={br}
                          type="button"
                          onClick={() => setNewCardBrand(br)}
                          className={`flex-1 py-1.5 border text-[10px] font-bold font-quattrocento rounded-lg cursor-pointer transition-all ${
                            newCardBrand === br ? "bg-amber border-amber text-black" : "border-aluminum/10 text-aluminum-dark"
                          }`}
                        >
                          {br}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Número de tarjeta (16 dígitos)"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      required
                      className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-2.5 px-4 text-xs font-quattrocento text-aluminum focus:outline-none transition-all"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={newCardExpiry}
                        onChange={(e) => setNewCardExpiry(e.target.value.substring(0, 5))}
                        required
                        className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-2.5 px-4 text-xs font-quattrocento text-aluminum focus:outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Nombre titular"
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                        required
                        className="bg-black/60 border border-aluminum/10 focus:border-amber/40 rounded-xl py-2.5 px-4 text-xs font-quattrocento text-aluminum focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={addingCard}
                    className="w-full bg-amber text-black font-quattrocento text-xs font-bold uppercase tracking-widest py-3 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={14} />
                    {addingCard ? "Guardando..." : "Guardar Tarjeta"}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
