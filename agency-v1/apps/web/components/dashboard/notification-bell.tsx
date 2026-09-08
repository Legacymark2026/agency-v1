"use client";

/**
 * components/dashboard/notification-bell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Center — Ultra-Professional Bell + Glassmorphic Dropdown
 * 
 * Features:
 * - Intelligent JSON / Event payload parser (Zero raw data leaks, clean human typography)
 * - Category filter pills with reactive badges and accent glows
 * - Metadata chips for Leads, Deals, Invoices, Workflows, Security & Support
 * - Audio tuning controls with WebAudio synthesizers (Chime, Digital, Soft)
 * - Date grouping with sticky day headers
 * - Deep linking to CRM, Finance, Automation, Inbox, IAM modules
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Check, Trash2, MailOpen, Volume2, VolumeX, X,
  User, UserPlus, UserCheck, ArrowRightLeft, Trophy, XCircle, TrendingUp,
  MessageSquare, AlertTriangle, PhoneForwarded, CheckCircle2, XOctagon,
  Rocket, Bot, ShieldAlert, FileText, CircleDollarSign, AlertCircle,
  Wallet, BadgeCheck, Ban, Share2, Send, CalendarPlus, AlarmClock,
  BookOpen, MessageCircle, Shield, Wrench, Sparkles, Settings,
  DollarSign, Megaphone, Calendar, Workflow, Users, Filter, SlidersHorizontal,
  Briefcase, TrendingDown, Lock, Award, ClipboardList, GraduationCap,
  UserMinus, Key, Download, ServerCrash, Unplug, PlugZap, RefreshCw,
  Flag, Timer, PauseCircle, Eye, Video, HardDrive, AtSign, ArrowRight,
  ExternalLink, Sparkle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} from "@/actions/notifications";
import { CATEGORY_META, type NotificationCategory } from "@/lib/notifications/notification-types";
import { playWebAudioSound } from "./notification-listener";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Icon Mapping ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus, UserCheck, ArrowRightLeft, Trophy, XCircle, TrendingUp,
  MessageSquare, AlertTriangle, PhoneForwarded, CheckCircle2, XOctagon,
  Rocket, Bot, ShieldAlert, FileText, CircleDollarSign, AlertCircle,
  Wallet, BadgeCheck, Ban, Share2, Send, CalendarPlus, AlarmClock,
  BookOpen, MessageCircle, Shield, Wrench, Sparkles, Settings,
  DollarSign, Megaphone, Calendar, Workflow, Users, Bell, Filter,
  BotOff: Bot,
};

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  CRM: Users,
  INBOX: MessageSquare,
  AUTOMATION: Workflow,
  AI_ENGINE: Bot,
  FINANCE: DollarSign,
  MARKETING: Megaphone,
  CALENDAR: Calendar,
  CONTENT: FileText,
  IAM: Shield,
  SYSTEM: Settings,
  OPERATIONS: Briefcase,
  HR: Users,
  SALES: TrendingUp,
  SECURITY: ShieldAlert,
};

const LEGACY_TYPE_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  NEW_LEAD: { icon: Users, color: "text-blue-400" },
  DEAL_WON: { icon: Trophy, color: "text-emerald-400" },
  DEAL_LOST: { icon: XCircle, color: "text-red-400" },
  AUTOMATION_ALERT: { icon: AlertTriangle, color: "text-amber-400" },
};

// ─── Intelligent Notification Payload Parser ──────────────────────────────────

interface ParsedCardData {
  cleanTitle: string;
  cleanMessage: string;
  badges: Array<{ label: string; value: string; colorStyle?: string }>;
  smartLink: string | null;
  actionText: string;
  categoryLabel: string;
  categoryBadgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

function parseNotificationPayload(notif: any): ParsedCardData {
  const rawTitle = (notif.title || "Notificación de Plataforma").trim();
  let rawMessage = (notif.message || "").trim();
  let extractedData: any = null;

  // Try parsing JSON if message starts with '{' or '[' or contains serialized JSON
  if (typeof rawMessage === "string" && (rawMessage.startsWith("{") || rawMessage.startsWith("["))) {
    try {
      extractedData = JSON.parse(rawMessage);
    } catch {
      // Regex recovery for truncated JSON strings like '{"data":{"id":"...
      const nameMatch = rawMessage.match(/"name":\s*"([^"]+)"/);
      const emailMatch = rawMessage.match(/"email":\s*"([^"]+)"/);
      const phoneMatch = rawMessage.match(/"phone":\s*"([^"]+)"/);
      const sourceMatch = rawMessage.match(/"source":\s*"([^"]+)"/);
      const idMatch = rawMessage.match(/"id":\s*"([^"]+)"/);
      const titleMatch = rawMessage.match(/"title":\s*"([^"]+)"/);
      const amountMatch = rawMessage.match(/"amount":\s*([0-9.]+)/);
      if (nameMatch || emailMatch || phoneMatch || idMatch || titleMatch || amountMatch) {
        extractedData = {
          name: nameMatch?.[1],
          email: emailMatch?.[1],
          phone: phoneMatch?.[1],
          source: sourceMatch?.[1],
          id: idMatch?.[1],
          title: titleMatch?.[1],
          amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        };
      }
    }
  }

  // Fallback to notif.metadata if extractedData is still empty
  if (!extractedData && notif.metadata && typeof notif.metadata === "object") {
    extractedData = notif.metadata;
  }

  const payload = extractedData?.data || extractedData || {};
  const badges: Array<{ label: string; value: string; colorStyle?: string }> = [];

  let cleanTitle = rawTitle;
  let cleanMessage = rawMessage;
  let smartLink = notif.link || null;
  let actionText = "Ver Detalle →";

  // Category and visual styles
  const catKey = (notif.type || "SYSTEM").toUpperCase();
  let categoryLabel = "SISTEMA";
  let categoryBadgeClass = "bg-slate-800 text-slate-300 border-slate-700";
  let iconBgClass = "bg-teal-500/10 border-teal-500/25";
  let iconColorClass = "text-teal-400";

  if (catKey.includes("CRM") || rawTitle.toLowerCase().includes("lead") || rawTitle.toLowerCase().includes("deal")) {
    categoryLabel = "CRM & VENTAS";
    categoryBadgeClass = "bg-blue-500/15 text-blue-400 border-blue-500/30";
    iconBgClass = "bg-blue-500/10 border-blue-500/25";
    iconColorClass = "text-blue-400";
    if (!smartLink) smartLink = "/dashboard/crm/leads";
    actionText = "Ver en CRM →";
  } else if (catKey.includes("FINANCE") || rawTitle.toLowerCase().includes("factura") || rawTitle.toLowerCase().includes("pago") || rawTitle.toLowerCase().includes("dian")) {
    categoryLabel = "FINANZAS & DIAN";
    categoryBadgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    iconBgClass = "bg-emerald-500/10 border-emerald-500/25";
    iconColorClass = "text-emerald-400";
    if (!smartLink) smartLink = "/dashboard/finance/invoices";
    actionText = "Ver Facturación →";
  } else if (catKey.includes("SECURITY") || catKey.includes("IAM") || rawTitle.toLowerCase().includes("bloque") || rawTitle.toLowerCase().includes("rol")) {
    categoryLabel = "SEGURIDAD & IAM";
    categoryBadgeClass = "bg-rose-500/15 text-rose-400 border-rose-500/30";
    iconBgClass = "bg-rose-500/10 border-rose-500/25";
    iconColorClass = "text-rose-400";
    if (!smartLink) smartLink = "/dashboard/iam";
    actionText = "Auditoría IAM →";
  } else if (catKey.includes("AUTOMATION") || rawTitle.toLowerCase().includes("workflow") || rawTitle.toLowerCase().includes("automatiz")) {
    categoryLabel = "AUTOMATIZACIÓN";
    categoryBadgeClass = "bg-purple-500/15 text-purple-400 border-purple-500/30";
    iconBgClass = "bg-purple-500/10 border-purple-500/25";
    iconColorClass = "text-purple-400";
    if (!smartLink) smartLink = "/dashboard/automation/workflows";
    actionText = "Ver Flujo →";
  } else if (catKey.includes("MARKETING") || rawTitle.toLowerCase().includes("campaña") || rawTitle.toLowerCase().includes("email")) {
    categoryLabel = "MARKETING";
    categoryBadgeClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
    iconBgClass = "bg-amber-500/10 border-amber-500/25";
    iconColorClass = "text-amber-400";
    if (!smartLink) smartLink = "/dashboard/marketing";
    actionText = "Ver Campaña →";
  } else if (catKey.includes("INBOX") || rawTitle.toLowerCase().includes("mensaje") || rawTitle.toLowerCase().includes("chat")) {
    categoryLabel = "INBOX & SOPORTE";
    categoryBadgeClass = "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    iconBgClass = "bg-cyan-500/10 border-cyan-500/25";
    iconColorClass = "text-cyan-400";
    if (!smartLink) smartLink = "/dashboard/inbox";
    actionText = "Abrir Conversación →";
  }

  // ── CRM Lead Detection & Humanization ──────────────────────────────────────
  if (rawTitle.toLowerCase().includes("lead") || rawTitle.toLowerCase().includes("nuevo lead")) {
    const leadName = payload.name || payload.contactName || (rawTitle.includes(":") ? rawTitle.split(":")[1]?.trim() : "Nuevo Prospecto");
    const leadSource = payload.source || (payload.city ? `Web (${payload.city})` : "Formulario Web");
    const leadId = payload.id || notif.id;

    cleanMessage = `Prospecto comercial registrado exitosamente en el pipeline de ventas.`;
    badges.push({ label: "Lead", value: leadName, colorStyle: "text-blue-300 border-blue-500/30 bg-blue-500/10" });
    badges.push({ label: "Origen", value: leadSource, colorStyle: "text-slate-300 border-slate-700 bg-slate-900" });
    if (payload.phone) {
      badges.push({ label: "Tel", value: payload.phone, colorStyle: "text-teal-300 border-teal-500/30 bg-teal-500/10" });
    }
    if (payload.email) {
      badges.push({ label: "Email", value: payload.email, colorStyle: "text-slate-300 border-slate-700 bg-slate-900" });
    }
    smartLink = `/dashboard/crm/leads?id=${leadId}`;
    actionText = "Gestionar Lead →";
  } else if (extractedData) {
    // Other JSON Payloads (Deals, Invoices, Tasks)
    if (payload.title || payload.dealTitle) {
      cleanMessage = `Oportunidad: "${payload.title || payload.dealTitle}". Etapa comercial: ${payload.stage || "En Negociación"}.`;
      if (payload.amount || payload.value) {
        badges.push({ label: "Valor", value: `$${Number(payload.amount || payload.value).toLocaleString()} USD`, colorStyle: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" });
      }
      smartLink = "/dashboard/crm/deals";
      actionText = "Ver Oportunidad →";
    } else if (payload.invoiceNumber || payload.number) {
      cleanMessage = `Factura electrónica #${payload.invoiceNumber || payload.number} generada para ${payload.clientName || "Cliente"}.`;
      if (payload.amount) {
        badges.push({ label: "Total", value: `$${Number(payload.amount).toLocaleString()} COP`, colorStyle: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" });
      }
      smartLink = "/dashboard/finance/invoices";
      actionText = "Ver Factura →";
    } else if (payload.message && typeof payload.message === "string") {
      cleanMessage = payload.message;
    } else {
      cleanMessage = "Actualización registrada en la plataforma corporativa.";
    }
  }

  // Safety net: purge any residual raw JSON syntax
  if (cleanMessage.includes('{"data":') || cleanMessage.includes('{"id":') || cleanMessage.startsWith("{") || cleanMessage.startsWith("[")) {
    cleanMessage = "Notificación procesada y registrada en el sistema.";
  }

  return {
    cleanTitle,
    cleanMessage,
    badges,
    smartLink,
    actionText,
    categoryLabel,
    categoryBadgeClass,
    iconBgClass,
    iconColorClass,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null);
  
  // Sound controls (synchronized via localStorage)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState("chime");
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const prevUnreadRef = useRef(0);

  // Load sound configurations from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundEnabled(localStorage.getItem("lm_notif_sound_enabled") !== "false");
      setSoundType(localStorage.getItem("lm_notif_sound_type") || "chime");
      const vol = localStorage.getItem("lm_notif_sound_volume");
      setSoundVolume(vol ? parseFloat(vol) : 0.3);
    }
  }, []);

  const toggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("lm_notif_sound_enabled", String(enabled));
  };

  const changeSoundType = (type: string) => {
    setSoundType(type);
    localStorage.setItem("lm_notif_sound_type", type);
    if (soundEnabled) {
      playWebAudioSound(type, soundVolume);
    }
  };

  const changeVolume = (vol: number) => {
    setSoundVolume(vol);
    localStorage.setItem("lm_notif_sound_volume", String(vol));
  };

  const fetchAlerts = useCallback(async () => {
    const result = await getNotifications({
      category: selectedCategory || undefined,
      take: 30,
    });
    if (result.success) {
      setNotifications(result.data || []);
      setGrouped(result.grouped || {});
      setHasMore(result.hasMore || false);

      // Play sound if new unread notifications arrived
      if (soundEnabled && result.unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
        playWebAudioSound(soundType, soundVolume);
      }
      prevUnreadRef.current = result.unreadCount;
      setUnreadCount(result.unreadCount || 0);
    }
  }, [selectedCategory, soundEnabled, soundType, soundVolume]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    fetchAlerts();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    fetchAlerts();
  };

  const handleReadAll = async () => {
    await markAllNotificationsAsRead(selectedCategory || undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    fetchAlerts();
  };

  const handleClearRead = async () => {
    await clearReadNotifications();
    fetchAlerts();
  };

  const getNotifIcon = (notif: any, parsed: ParsedCardData) => {
    const iconName = notif.metadata?.icon;
    const IconComponent = iconName ? ICON_MAP[iconName] : null;

    if (IconComponent) {
      return <IconComponent className={cn("h-4 w-4", parsed.iconColorClass)} />;
    }

    const legacy = LEGACY_TYPE_MAP[notif.type];
    if (legacy) {
      const LegacyIcon = legacy.icon;
      return <LegacyIcon className={cn("h-4 w-4", legacy.color)} />;
    }

    const CatIcon = CATEGORY_ICON_MAP[notif.type] || Bell;
    return <CatIcon className={cn("h-4 w-4", parsed.iconColorClass)} />;
  };

  const categories = Object.entries(CATEGORY_META) as [NotificationCategory, typeof CATEGORY_META[NotificationCategory]][];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group rounded-xl transition-all duration-200 hover:bg-slate-900/80"
          id="notification-bell"
        >
          <Bell className="h-5 w-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[19px] h-[19px] text-[10px] font-black bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-[0_0_12px_rgba(20,184,166,0.6)] animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[420px] sm:w-[480px] bg-slate-950/95 border border-slate-800/80 p-0 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(20,184,166,0.08)] rounded-2xl backdrop-blur-2xl"
        sideOffset={8}
      >
        {/* ── Top Radiant Accent Line ────────────────────────── */}
        <div className="h-[2px] w-full bg-gradient-to-r from-teal-500 via-cyan-400 to-indigo-500" />

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/70 border-b border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 shadow-[0_0_12px_rgba(20,184,166,0.15)]">
              <Bell className="h-4 w-4 text-teal-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-100 tracking-wide">Notificaciones</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.15)]">
                    {unreadCount} {unreadCount === 1 ? "NUEVA" : "NUEVAS"}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Centro de eventos en tiempo real</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 text-slate-400 hover:text-teal-400 rounded-xl hover:bg-slate-850 transition-colors",
                soundSettingsOpen && "text-teal-400 bg-slate-850 shadow-[0_0_10px_rgba(20,184,166,0.15)]"
              )}
              onClick={() => setSoundSettingsOpen(!soundSettingsOpen)}
              title="Ajustes de Alerta Sonora"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReadAll}
                className="h-8 text-xs font-semibold text-slate-300 hover:text-teal-300 px-2.5 rounded-xl hover:bg-teal-500/10 hover:border hover:border-teal-500/25 transition-all"
              >
                <Check className="h-3.5 w-3.5 mr-1 text-teal-400" /> Leer todas
              </Button>
            )}
          </div>
        </div>

        {/* ── Sound Settings Panel ──────────────────────────── */}
        <AnimatePresence>
          {soundSettingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-slate-800/60 bg-slate-900/90"
            >
              <div className="p-3.5 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? <Volume2 className="h-4 w-4 text-teal-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
                    <span className="font-semibold text-slate-200">Alertas Sonoras Sintetizadas</span>
                  </div>
                  <button
                    onClick={() => toggleSound(!soundEnabled)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer",
                      soundEnabled ? "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]" : "bg-slate-800"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full bg-slate-950 transition-transform duration-200 shadow-sm",
                      soundEnabled ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
                {soundEnabled && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Timbre Auditivo</span>
                      <div className="flex gap-1.5">
                        {[
                          { key: "chime", label: "Campana" },
                          { key: "tech", label: "Digital" },
                          { key: "soft", label: "Suave" },
                        ].map((s) => (
                          <button
                            key={s.key}
                            onClick={() => changeSoundType(s.key)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                              soundType === s.key
                                ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400 font-medium">Volumen Maestro</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                        className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category Filter Pills ──────────────────────────── */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-slate-800/40 bg-slate-900/30 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap shrink-0 cursor-pointer",
              !selectedCategory
                ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                : "text-slate-400 hover:text-slate-200 border-slate-850 hover:border-slate-700 bg-slate-900/40"
            )}
          >
            <Sparkles className="h-3 w-3" />
            Todas
          </button>
          {categories.map(([key, meta]) => {
            const CatIcon = CATEGORY_ICON_MAP[key] || Bell;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(isSelected ? null : key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                    : "text-slate-400 hover:text-slate-200 border-slate-850 hover:border-slate-700 bg-slate-900/40"
                )}
              >
                <CatIcon className="h-3 w-3" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* ── Notification List ───────────────────────────────── */}
        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <CheckCircle2 className="h-7 w-7 text-teal-400/80" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Todo al día</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[260px]">
                  No tienes notificaciones pendientes {selectedCategory ? `en ${CATEGORY_META[selectedCategory]?.label}` : "en este momento"}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-800/30">
              <AnimatePresence initial={false}>
                {Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-950/90 backdrop-blur-md border-y border-slate-850/80 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {dateLabel}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-600">
                        {items.length} {items.length === 1 ? "evento" : "eventos"}
                      </span>
                    </div>

                    {items.map((notif: any) => {
                      const parsed = parseNotificationPayload(notif);

                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "flex items-start gap-3.5 px-4 py-3.5 text-sm transition-all relative group cursor-default",
                            !notif.isRead
                              ? "bg-gradient-to-r from-teal-500/[0.06] via-slate-900/30 to-transparent border-l-[3px] border-l-teal-400"
                              : "hover:bg-slate-900/40 border-l-[3px] border-l-transparent opacity-85 hover:opacity-100"
                          )}
                        >
                          {/* Category-Tinted Glowing Icon */}
                          <div className={cn("flex-shrink-0 mt-0.5 p-2.5 rounded-xl border shadow-sm", parsed.iconBgClass)}>
                            {getNotifIcon(notif, parsed)}
                          </div>

                          {/* Content Container */}
                          <div className="flex-1 min-w-0 pr-10">
                            {/* Meta row: Category pill + Time + Pulsing unread dot */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border", parsed.categoryBadgeClass)}>
                                {parsed.categoryLabel}
                              </span>
                              <span className="text-slate-600 text-xs">•</span>
                              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                              </span>
                              {!notif.isRead && (
                                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)] ml-auto shrink-0" title="No leída" />
                              )}
                            </div>

                            {/* Title */}
                            <h4 className={cn("font-bold text-xs leading-snug tracking-tight", !notif.isRead ? "text-slate-100 group-hover:text-teal-200 transition-colors" : "text-slate-300")}>
                              {parsed.cleanTitle}
                            </h4>

                            {/* Humanized Narrative */}
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {parsed.cleanMessage}
                            </p>

                            {/* Structured Metadata Badges */}
                            {parsed.badges.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {parsed.badges.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border",
                                      b.colorStyle || "bg-slate-900/90 text-slate-300 border-slate-800"
                                    )}
                                  >
                                    <span className="text-slate-500 font-sans font-semibold">{b.label}:</span>
                                    <span className="font-bold">{b.value}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Deep Link Button */}
                            {parsed.smartLink && (
                              <div className="mt-2.5">
                                <Link
                                  href={parsed.smartLink}
                                  onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors group/link"
                                >
                                  <span>{parsed.actionText}</span>
                                  <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
                                </Link>
                              </div>
                            )}
                          </div>

                          {/* Quick Action Buttons (Fade-in on hover) */}
                          <div className="absolute right-3 top-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-md">
                            {!notif.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors"
                                onClick={() => handleMarkAsRead(notif.id)}
                                title="Marcar como leída"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              onClick={() => handleDelete(notif.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-semibold text-slate-400 hover:text-rose-400 px-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            onClick={handleClearRead}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpiar leídas
          </Button>
          <Link
            href="/dashboard/settings/notifications"
            className="text-xs font-bold text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-3.5 w-3.5" /> Preferencias
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
