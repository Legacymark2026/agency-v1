"use client";

/**
 * components/dashboard/notification-bell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Center — Bell + Dropdown with category filters,
 * date grouping, sound toggle, and infinite scroll.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Check, Trash2, MailOpen, Volume2, VolumeX, X,
  User, UserPlus, UserCheck, ArrowRightLeft, Trophy, XCircle, TrendingUp,
  MessageSquare, AlertTriangle, PhoneForwarded, CheckCircle2, XOctagon,
  Rocket, Bot, ShieldAlert, FileText, CircleDollarSign, AlertCircle,
  Wallet, BadgeCheck, Ban, Share2, Send, CalendarPlus, AlarmClock,
  BookOpen, MessageCircle, Shield, Wrench, Sparkles, Settings,
  DollarSign, Megaphone, Calendar, Workflow, Users, Filter, SlidersHorizontal
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
  BotOff: Bot, // Fallback
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
};

const LEGACY_TYPE_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  NEW_LEAD: { icon: Users, color: "text-blue-400" },
  DEAL_WON: { icon: Trophy, color: "text-emerald-400" },
  DEAL_LOST: { icon: XCircle, color: "text-red-400" },
  AUTOMATION_ALERT: { icon: AlertTriangle, color: "text-red-500" },
};

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
    fetchAlerts(); // Re-fetch to update grouped state
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

  const getNotifIcon = (notif: any) => {
    const iconName = notif.metadata?.icon;
    const IconComponent = iconName ? ICON_MAP[iconName] : null;
    const color = notif.metadata?.color || "text-slate-400";

    if (IconComponent) {
      return <IconComponent className={cn("h-4 w-4", color)} />;
    }

    const legacy = LEGACY_TYPE_MAP[notif.type];
    if (legacy) {
      const LegacyIcon = legacy.icon;
      return <LegacyIcon className={cn("h-4 w-4", legacy.color)} />;
    }

    const CatIcon = CATEGORY_ICON_MAP[notif.type] || Bell;
    return <CatIcon className={cn("h-4 w-4", color)} />;
  };

  const categories = Object.entries(CATEGORY_META) as [NotificationCategory, typeof CATEGORY_META[NotificationCategory]][];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group rounded-xl transition-all duration-200" id="notification-bell">
          <Bell className="h-5 w-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] font-bold bg-teal-500 text-slate-950 rounded-full border border-slate-950 flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] sm:w-[440px] bg-slate-950/95 border-slate-800/80 p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(13,148,136,0.05)] rounded-2xl backdrop-blur-md"
        sideOffset={8}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/60 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Bell className="h-4 w-4 text-teal-400 animate-swing" />
            </div>
            <span className="font-bold text-sm text-slate-200 tracking-wide">Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-teal-500/15 text-teal-400 border border-teal-500/25 text-[10px] font-bold px-1.5 py-0">
                {unreadCount} NUEVAS
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 text-slate-500 hover:text-teal-400 rounded-lg hover:bg-slate-800/50 transition-colors",
                soundSettingsOpen && "text-teal-400 bg-slate-900"
              )}
              onClick={() => setSoundSettingsOpen(!soundSettingsOpen)}
              title="Ajustes de Sonido"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReadAll}
                className="h-7 text-xs text-slate-400 hover:text-teal-400 px-2 rounded-lg hover:bg-slate-800/30"
              >
                <Check className="h-3 w-3 mr-1" /> Leer todas
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
              className="overflow-hidden border-b border-slate-800/50 bg-slate-950/95"
            >
              <div className="p-3.5 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Activar alertas sonoras</span>
                  <button
                    onClick={() => toggleSound(!soundEnabled)}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5",
                      soundEnabled ? "bg-teal-500" : "bg-slate-800"
                    )}
                  >
                    <span className={cn(
                      "w-3 h-3 rounded-full bg-slate-950 transition-transform duration-200",
                      soundEnabled ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
                {soundEnabled && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Estilo de Alerta</span>
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
                              "px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer",
                              soundType === s.key
                                ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.1)]"
                                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Volumen</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => changeVolume(parseFloat(e.target.value))}
                        className="w-28 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category Filter Pills ──────────────────────────── */}
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-slate-800/30 bg-slate-900/10 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 cursor-pointer",
              !selectedCategory
                ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.08)]"
                : "text-slate-500 hover:text-slate-300 border-slate-900 hover:border-slate-800 bg-slate-950/20"
            )}
          >
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
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.08)]"
                    : "text-slate-500 hover:text-slate-300 border-slate-900 hover:border-slate-800 bg-slate-950/20"
                )}
              >
                <CatIcon className="h-3 w-3" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* ── Notification List ───────────────────────────────── */}
        <ScrollArea className="max-h-[380px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850">
                <MailOpen className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">Todo al día</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  No hay notificaciones {selectedCategory ? `en ${CATEGORY_META[selectedCategory]?.label}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <div className="px-4 py-1.5 bg-slate-900/30 border-y border-slate-900/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{dateLabel}</span>
                    </div>
                    {items.map((notif: any) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-start gap-3.5 px-4 py-3.5 text-sm border-b border-slate-900/50",
                          "hover:bg-slate-900/30 transition-colors relative group cursor-default",
                          !notif.isRead && "bg-teal-500/[0.02] border-l-2 border-l-teal-500/40"
                        )}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-850">
                          {getNotifIcon(notif)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-8">
                          <p className={cn("font-bold text-xs leading-snug", !notif.isRead ? "text-slate-200" : "text-slate-400")}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] text-slate-600 font-semibold tracking-wider uppercase">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                            </span>
                            {notif.link && (
                              <Link
                                href={notif.link}
                                onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }}
                                className="text-[9px] font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-wider"
                              >
                                Ver detalles →
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Actions (hover) */}
                        <div className="absolute right-3 top-3.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-teal-400 hover:bg-slate-900 rounded-md border border-slate-900"
                              onClick={() => handleMarkAsRead(notif.id)}
                              title="Marcar como leída"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-md border border-slate-900"
                            onClick={() => handleDelete(notif.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ─────────────────────────────────────────── */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-800/40 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 hover:text-red-450 px-2 rounded-lg hover:bg-slate-900"
              onClick={handleClearRead}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpiar leídas
            </Button>
            <Link
              href="/dashboard/settings/notifications"
              className="text-xs font-semibold text-slate-500 hover:text-teal-400 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              ⚙ Preferencias
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
