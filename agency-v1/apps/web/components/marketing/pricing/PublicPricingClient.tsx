"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { 
  Zap, ArrowRight, Sparkles, Clock, Search, Building2, Tag, CheckCircle2, ShieldCheck, 
  Plus, Check, ShoppingBag, X, SlidersHorizontal, ChevronDown, ChevronUp, Save, DollarSign, 
  ArrowUpDown, Percent, Users, Award, Lightbulb, BarChart3, Rocket, Code, Palette, PenTool, 
  Video, Database, Brain, Megaphone, Mail, Globe, Smartphone, TrendingUp, FileText, Layers, 
  Target, Eye, Share2, MessageSquare, Search as SearchIcon, Calendar, CheckSquare, Minus, 
  Star, Filter, Info, ExternalLink, Copy, Check as CheckIcon, MessageCircle, HelpCircle, 
  ArrowLeft, CreditCard, Package, Calculator, Zap as ZapIcon, RefreshCw, ArrowUpRight
} from "lucide-react";


import { ServicePrice } from "@/types/pricing";

interface PublicPricingClientProps {
  services: ServicePrice[];
}

// -------------------------------------------------------------------------------------
// CATEGORY MAPPING (Hero Styles)
// -------------------------------------------------------------------------------------
const CATEGORY_STYLES: Record<string, { icon: any; color: string; bg: string; gradient: string; label: string }> = {
  "marketing": { icon: Megaphone, color: "text-pink-400", bg: "bg-pink-400/10", gradient: "from-pink-500 to-rose-500", label: "Marketing" },
  "contenido": { icon: FileText, color: "text-pink-400", bg: "bg-pink-400/10", gradient: "from-pink-500 to-rose-500", label: "Contenido" },
  "redes sociales": { icon: Share2, color: "text-pink-400", bg: "bg-pink-400/10", gradient: "from-pink-500 to-rose-500", label: "Redes" },
  "publicidad": { icon: Rocket, color: "text-orange-400", bg: "bg-orange-400/10", gradient: "from-orange-500 to-red-500", label: "Publicidad" },
  "estrategia": { icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-400/10", gradient: "from-yellow-500 to-orange-500", label: "Estrategia" },
  "branding": { icon: Palette, color: "text-purple-400", bg: "bg-purple-400/10", gradient: "from-purple-500 to-pink-500", label: "Branding" },
  "identidad": { icon: PenTool, color: "text-purple-400", bg: "bg-purple-400/10", gradient: "from-purple-500 to-pink-500", label: "Identidad" },
  "diseño": { icon: Palette, color: "text-purple-400", bg: "bg-purple-400/10", gradient: "from-purple-500 to-pink-500", label: "Diseño" },
  "grafico": { icon: Palette, color: "text-purple-400", bg: "bg-purple-400/10", gradient: "from-purple-500 to-pink-500", label: "Diseño" },
  "desarrollo": { icon: Code, color: "text-blue-400", bg: "bg-blue-400/10", gradient: "from-blue-500 to-indigo-500", label: "Desarrollo" },
  "web": { icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10", gradient: "from-blue-500 to-indigo-500", label: "Web" },
  "software": { icon: Code, color: "text-blue-400", bg: "bg-blue-400/10", gradient: "from-blue-500 to-indigo-500", label: "Software" },
  "tech": { icon: Database, color: "text-blue-400", bg: "bg-blue-400/10", gradient: "from-blue-500 to-indigo-500", label: "Tech" },
  "video": { icon: Video, color: "text-red-400", bg: "bg-red-400/10", gradient: "from-red-500 to-orange-500", label: "Video" },
  "audiovisual": { icon: Video, color: "text-red-400", bg: "bg-red-400/10", gradient: "from-red-500 to-orange-500", label: "Audiovisual" },
  "produccion": { icon: Video, color: "text-red-400", bg: "bg-red-400/10", gradient: "from-red-500 to-orange-500", label: "Producción" },
  "analitica": { icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-400/10", gradient: "from-emerald-500 to-teal-500", label: "Analítica" },
  "data": { icon: Database, color: "text-emerald-400", bg: "bg-emerald-400/10", gradient: "from-emerald-500 to-teal-500", label: "Data" },
  "ia": { icon: Brain, color: "text-emerald-400", bg: "bg-emerald-400/10", gradient: "from-emerald-500 to-teal-500", label: "IA" },
  "ai": { icon: Brain, color: "text-emerald-400", bg: "bg-emerald-400/10", gradient: "from-emerald-500 to-teal-500", label: "AI" },
  "ventas": { icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-400/10", gradient: "from-teal-500 to-cyan-500", label: "Ventas" },
  "crm": { icon: Users, color: "text-teal-400", bg: "bg-teal-400/10", gradient: "from-teal-500 to-cyan-500", label: "CRM" },
  "default": { icon: Sparkles, color: "text-slate-400", bg: "bg-slate-400/10", gradient: "from-slate-500 to-slate-600", label: "Otros" },
};

function getCategoryStyle(categoria: string) {
  const lower = categoria.toLowerCase();
  for (const key in CATEGORY_STYLES) {
    if (lower.includes(key)) return CATEGORY_STYLES[key];
  }
  return CATEGORY_STYLES["default"];
}

// -------------------------------------------------------------------------------------
// CURRENCY SYSTEM
// -------------------------------------------------------------------------------------
const CURRENCIES = {
  COP: { symbol: '$', rate: 1, locale: 'es-CO' },
  USD: { symbol: '$', rate: 0.00025, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.00023, locale: 'de-DE' },
};

type Currency = 'COP' | 'USD' | 'EUR';

// -------------------------------------------------------------------------------------
// COUPON SYSTEM
// -------------------------------------------------------------------------------------
const COUPONS: Record<string, number> = {
  "BIENVENIDO10": 0.10,
  "AGENCIA20": 0.20,
  "LEGY25": 0.25,
};

// -------------------------------------------------------------------------------------
// MODAL COMPONENT (Hero Style)
// -------------------------------------------------------------------------------------
function ServiceModal({ service, isOpen, onClose, isSelected, onToggle, quantity, setQuantity }: any) {
  if (!isOpen || !service) return null;
  
  const style = getCategoryStyle(service.categoria);
  const subtotal = service.precio_base * (1 + (service.iva_porcentaje / 100)) * quantity;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl ds-card max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex justify-between items-center pb-4 border-b border-[rgba(30,41,59,0.8)] mb-4">
            <h2 className="ds-heading-card flex items-center gap-2">
               {service.nombre_servicio}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 w-8 h-8 flex items-center justify-center ds-icon-box hover:text-white transition"
              aria-label="Cerrar detalles de servicio"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="pt-2">
            <div className="flex items-start justify-between mb-6">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${style.bg} ${style.color} shadow-lg`}>
                <style.icon size={28} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal)}
                </div>
                <span className="text-xs text-slate-400 font-medium">Impuestos incluidos</span>
              </div>
            </div>

            <p className="text-gray-300 text-lg mb-8 leading-relaxed">{service.descripcion}</p>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5 mb-8">
              <div>
                <span className="text-sm font-medium text-white block">Cantidad</span>
                <span className="text-xs text-gray-400">Selecciona la cantidad needed</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="w-12 text-center text-xl font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)} 
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={onClose} className="flex-1 py-4 rounded-xl border border-white/20 text-white hover:bg-white/5 font-medium transition">
                Cerrar
              </button>
              <button onClick={() => { onToggle(); onClose(); }} className={`flex-1 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                isSelected ? "bg-white/10 border border-white/20 text-white" : "bg-white text-black hover:bg-gray-200"
              }`}>
                {isSelected ? <><CheckCircle2 className="w-5 h-5" /> Seleccionado</> : <><Plus className="w-5 h-5" /> Añadir al Paquete</>}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------------------------------
// SERVICE CARD (Homepage Style)
// -------------------------------------------------------------------------------------
function ServiceCard({ service, isSelected, onToggle, highestId, onOpenModal, index }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const style = getCategoryStyle(service.categoria);
  const subtotal = service.precio_base * (1 + (service.iva_porcentaje / 100));
  const isPremium = service.id === highestId;

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden ds-card-sm cursor-pointer h-full !p-0"
      onMouseMove={handleMouseMove}
      onClick={() => onOpenModal(service)}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.07), transparent 80%)` }}
      />

      <div className="relative p-8 flex flex-col h-full z-10">
        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="text-white/50" aria-hidden="true" />
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className={`ds-icon-box transition-all group-hover:scale-110`}>
            <style.icon size={20} className={style.color} aria-hidden="true" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {isPremium && (
              <span className="ds-badge ds-badge-amber">
                <Star className="w-3 h-3" /> Top
              </span>
            )}
            <span className={`ds-badge ds-badge-slate`}>
              {style.label}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-3">{service.nombre_servicio}</h3>
          <p className={`text-gray-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{service.descripcion}</p>
        </div>

        {service.descripcion.length > 60 && (
          <button onClick={(e: any) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mb-4 self-start">
            {isExpanded ? <><ChevronUp className="w-3 h-3" aria-hidden="true" /> Ver menos</> : <><Info className="w-3 h-3" aria-hidden="true" /> Ver detalles</>}
          </button>
        )}

        <div className="mt-auto pt-6 border-t border-[rgba(30,41,59,0.8)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold font-mono text-teal-400">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal)}
            </div>
            <div className="ds-subtext mt-1">
              {service.tiempo_estimado ? `[T] ${service.tiempo_estimado}` : '[IMPUESTOS INCL.]'}
            </div>
          </div>
          <button onClick={(e: any) => { e.stopPropagation(); onToggle(); }} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border rounded-sm font-mono text-xs uppercase tracking-widest font-bold transition-all ${
            isSelected 
              ? "bg-[rgba(13,148,136,0.2)] border-[rgba(13,148,136,0.5)] text-teal-300 shadow-[0_0_15px_rgba(13,148,136,0.3)]" 
              : "bg-white/5 border-[rgba(30,41,59,0.8)] text-slate-300 hover:border-teal-500/50 hover:bg-teal-900/40"
          }`}>
            {isSelected ? <><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Añadido</> : <><Plus className="w-4 h-4" aria-hidden="true" /> Añadir</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------------------------------------
// MAIN COMPONENT (HERO LAYOUT)
// -------------------------------------------------------------------------------------
export function PublicPricingClient({ services }: PublicPricingClientProps) {
  const uniqueCategories = useMemo(() => Array.from(new Set(services.map(i => i.categoria))).sort(), [services]);
  
  const [activeTab, setActiveTab] = useState<string>(uniqueCategories[0] || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<ServicePrice[]>([]);
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name">("default");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  
  const [currency, setCurrency] = useState<Currency>("COP");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState(false);

  const [modalService, setModalService] = useState<ServicePrice | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('legacymark_quote');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setSelectedServices(services.filter(s => ids.includes(s.id)));
      } catch (e) { console.error(e); }
    }
  }, [services]);

  useEffect(() => {
    localStorage.setItem('legacymark_quote', JSON.stringify(selectedServices.map(s => s.id)));
  }, [selectedServices]);

  const filteredServices = useMemo(() => {
    let result = services;
    if (searchQuery.trim().length === 0) result = result.filter(s => s.categoria === activeTab);
    else result = result.filter(s => s.nombre_servicio.toLowerCase().includes(searchQuery.toLowerCase()) || s.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) || s.categoria.toLowerCase().includes(searchQuery.toLowerCase()));
    if (showPopular) result = [...result].sort((a,b) => b.precio_base - a.precio_base).slice(0, 6);
    result = result.filter(s => { const total = s.precio_base * (1 + (s.iva_porcentaje / 100)); return total >= priceRange[0] && total <= priceRange[1]; });
    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.precio_base - b.precio_base);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.precio_base - a.precio_base);
    else if (sortBy === "name") result = [...result].sort((a, b) => a.nombre_servicio.localeCompare(b.nombre_servicio));
    return result;
  }, [services, activeTab, searchQuery, priceRange, sortBy, showPopular]);

  const highestPricedServiceId = useMemo(() => filteredServices.length === 0 ? null : [...filteredServices].sort((a,b) => b.precio_base - a.precio_base)[0].id, [filteredServices]);

  const toggleServiceInCart = (service: ServicePrice) => {
    setSelectedServices(prev => prev.some(s => s.id === service.id) ? prev.filter(s => s.id !== service.id) : [...prev, service]);
  };

  const applyCoupon = () => {
    if (COUPONS[couponCode.toUpperCase()]) {
      setCouponApplied(true);
      setCouponError(false);
    } else {
      setCouponError(true);
      setCouponApplied(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((acc, s) => acc + (s.precio_base * (1 + s.iva_porcentaje / 100)), 0);
    const volumeDiscount = selectedServices.length >= 3 ? 0.10 : 0;
    const couponDiscount = couponApplied ? COUPONS[couponCode.toUpperCase()] : 0;
    const totalDiscount = volumeDiscount + couponDiscount;
    return { subtotal, discountAmount: subtotal * totalDiscount, total: subtotal * (1 - totalDiscount), volumeDiscount, couponDiscount };
  };

  const formatPrice = (price: number) => {
    const convPrice = price * CURRENCIES[currency].rate;
    return new Intl.NumberFormat(CURRENCIES[currency].locale, { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(convPrice);
  };

  const handleCheckout = () => {
    if (selectedServices.length === 0) return;
    const { total, discountAmount } = calculateTotal();
    let text = "Hola, cotizo los siguientes servicios:\n\n";
    selectedServices.forEach((s, i) => { const price = s.precio_base * (1 + s.iva_porcentaje / 100); text += `${i+1}. *${s.nombre_servicio}*\n   ${formatPrice(price)}\n`; });
    if (discountAmount > 0) text += `\n📦 *Descuento:* -${formatPrice(discountAmount)}\n`;
    text += `\n💰 *Total:* ${formatPrice(total)}\n\n¿Agenda llamada?`;
    window.open(`https://wa.me/573145629141?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="ds-page relative overflow-visible pb-40">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.025] pointer-events-none mix-blend-screen" />
      


      {/* Floating Console */}
      <AnimatePresence>
        {selectedServices.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
            <div className="ds-card !p-4 sm:!p-6 shadow-2xl">
              <div className="mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Descuento por volumen</span>
                  <span>{selectedServices.length}/3 servicios</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (selectedServices.length / 3) * 100)}%` }} className={`h-full ${selectedServices.length >= 3 ? 'bg-emerald-500' : 'bg-teal-500'}`} />
                </div>
                {calculateTotal().volumeDiscount > 0 && <div className="text-xs text-emerald-400 font-bold mt-1 text-right">✓ {calculateTotal().volumeDiscount * 100}% DESCUENTO</div>}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                     <ShoppingBag className="w-6 h-6 text-white" aria-hidden="true" />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-white">Tu Paquete</div>
                     <div className="text-xs text-zinc-400">{selectedServices.length} servicios</div>
                   </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="text-right flex-1">
                    {calculateTotal().discountAmount > 0 && <div className="text-xs text-zinc-500 line-through">{formatPrice(calculateTotal().subtotal)}</div>}
                    <div className="text-xl font-bold text-white">{formatPrice(calculateTotal().total)}</div>
                  </div>
                  <button onClick={handleCheckout} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg shadow-white/10">
                    Cotizar <ArrowRight className="w-4 h-4" />
                  </button>
                   <button 
                    onClick={() => setSelectedServices([])} 
                    className="p-3 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                    aria-label="Limpiar selección de servicios"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        
        {/* Header */}
        <div className="text-center mb-16 sm:mb-24 relative z-10 ds-card" style={{ padding: '4rem 2rem' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.07),transparent_70%)] pointer-events-none" />
          <div className="absolute top-4 right-4 font-mono text-xs text-slate-700 uppercase tracking-widest">[CMO_SYS · BUILDER]</div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-4">
             <span className="ds-badge ds-badge-teal mb-4">
                <span className="relative flex h-1.5 w-1.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
                </span>
                LIVE BUILDER
             </span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ds-heading-page text-5xl sm:text-7xl mb-6 text-white font-black">
            Catálogo HUD
          </motion.h1>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-gray-400 max-w-2xl mx-auto">
            Selecciona los servicios que necesitas. {selectedServices.length >= 3 ? "¡10% de descuento aplicado!" : "Añade 3+ para 10% dto."}
          </motion.p>

          {/* Currency Toggle */}
          <div className="flex justify-center gap-2 mt-8">
            {(Object.keys(CURRENCIES) as Currency[]).map(c => (
              <button key={c} onClick={() => setCurrency(c)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${currency === c ? "bg-white text-black" : "bg-white/10 text-gray-300 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <label htmlFor="pricing-search" className="sr-only">Buscar servicios</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
              <input 
                id="pricing-search"
                type="text" 
                placeholder="Buscar servicios..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20" 
              />
            </div>

            {/* Coupon Input */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label htmlFor="coupon-input" className="text-xs font-bold text-gray-400 uppercase block mb-2">Código descuento</label>
              <div className="flex gap-2">
                <input 
                  id="coupon-input"
                  type="text" 
                  placeholder="Ingresa código" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  className={`flex-1 bg-black/20 border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 ${couponError ? 'border-red-500' : 'border-white/10'}`} 
                />
                <button onClick={applyCoupon} className="shrink-0 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium">Aplicar</button>
              </div>
              {couponApplied && <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Aplicado</div>}
              {couponError && <div className="text-xs text-red-400 mt-2">Inválido</div>}
            </div>

            <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10">
              <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filtros</span>
              {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {isFiltersOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div>
                    <span className="text-xs font-mono text-gray-400 uppercase block mb-2">Precio</span>
                    <div className="flex gap-2">
                      <label htmlFor="min-price" className="sr-only">Precio mínimo</label>
                      <input id="min-price" type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                      <label htmlFor="max-price" className="sr-only">Precio máximo</label>
                      <input id="max-price" type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setSortBy("price_asc")} className={`px-2 py-1.5 rounded-lg text-xs ${sortBy === "price_asc" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-black/20 text-gray-400 border border-white/10"}`}>Menor $</button>
                    <button onClick={() => setSortBy("price_desc")} className={`px-2 py-1.5 rounded-lg text-xs ${sortBy === "price_desc" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-black/20 text-gray-400 border border-white/10"}`}>Mayor $</button>
                  </div>
                  <button onClick={() => setShowPopular(!showPopular)} className={`w-full px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-2 ${showPopular ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-black/20 text-gray-400 border border-white/10"}`}>
                    <Star className="w-3 h-3" /> Populares
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/5"><span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Categorías</span></div>
              <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1">
                {uniqueCategories.map((cat) => {
                  const style = getCategoryStyle(cat);
                  return (
                    <button key={cat} onClick={() => { setActiveTab(cat); setSearchQuery(""); setShowPopular(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${activeTab === cat && !searchQuery && !showPopular ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                      <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}><style.icon className={`w-4 h-4 ${style.color}`} /></div>
                      <span className="truncate">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="lg:col-span-9">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">{searchQuery ? `Resultados: "${searchQuery}"` : showPopular ? "Servicios Populares" : activeTab}</h2>
              <span className="text-sm text-gray-500">{filteredServices.length} servicios</span>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredServices.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-purple-500/30 rounded-3xl bg-purple-900/10">
                  <SearchIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <p className="text-purple-400">No se encontraron servicios</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                  {filteredServices.map((service, index) => (
                    <ServiceCard key={service.id} service={service} isSelected={selectedServices.some(s => s.id === service.id)} onToggle={() => toggleServiceInCart(service)} highestId={highestPricedServiceId} onOpenModal={(s: ServicePrice) => { setModalService(s); setModalQuantity(1); }} index={index} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ServiceModal 
        isOpen={!!modalService} 
        onClose={() => setModalService(null)} 
        service={modalService}
        isSelected={modalService ? selectedServices.some(s => s.id === modalService.id) : false}
        onToggle={() => modalService && toggleServiceInCart(modalService)}
        quantity={modalQuantity}
        setQuantity={setModalQuantity}
      />
    </div>
  );
}
