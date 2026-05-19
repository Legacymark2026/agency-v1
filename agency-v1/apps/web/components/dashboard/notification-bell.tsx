"use client";

/**
 * components/dashboard/notification-bell.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Notification Center — Bell + Dropdown with category filters,
 * date grouping, sound toggle, and infinite scroll.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Check, Trash2, MailOpen, Filter, Volume2, VolumeX, X, ChevronDown,
  User, UserPlus, UserCheck, ArrowRightLeft, Trophy, XCircle, TrendingUp,
  MessageSquare, AlertTriangle, PhoneForwarded, CheckCircle2, XOctagon,
  Rocket, Bot, ShieldAlert, FileText, CircleDollarSign, AlertCircle,
  Wallet, BadgeCheck, Ban, Share2, Send, CalendarPlus, AlarmClock,
  BookOpen, MessageCircle, Shield, Wrench, Sparkles, Settings,
  DollarSign, Megaphone, Calendar, Workflow, Users,
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
import Link from "next/link";
import { cn } from "@/lib/utils";

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

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUnreadRef = useRef(0);

  const fetchAlerts = useCallback(async () => {
    const result = await getNotifications({
      category: selectedCategory || undefined,
      take: 30,
    });
    if (result.success) {
      setNotifications(result.data || []);
      setGrouped(result.grouped || {});
      setHasMore(result.hasMore || false);

      // Play sound if new unread notifications appeared
      if (soundEnabled && result.unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
        playNotificationSound();
      }
      prevUnreadRef.current = result.unreadCount;
      setUnreadCount(result.unreadCount || 0);
    }
  }, [selectedCategory, soundEnabled]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAACAgICAgICAgICBgYKDhIWGh4mKi42Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8A");
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Rebuild groups
    fetchAlerts();
  };

  const handleReadAll = async () => {
    await markAllNotificationsAsRead(selectedCategory || undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
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
      return <IconComponent className={cn("h-5 w-5", color)} />;
    }

    // Fallback by category
    const CatIcon = CATEGORY_ICON_MAP[notif.type] || Bell;
    return <CatIcon className={cn("h-5 w-5", color)} />;
  };

  const categories = Object.entries(CATEGORY_META) as [NotificationCategory, typeof CATEGORY_META[NotificationCategory]][];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group" id="notification-bell">
          <Bell className="h-5 w-5 text-slate-300 group-hover:text-teal-400 transition-colors" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] text-xs bg-teal-500 hover:bg-teal-400 border-none flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] sm:w-[440px] bg-slate-950 border-slate-800 p-0 overflow-hidden shadow-2xl rounded-xl"
        sideOffset={8}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-teal-400" />
            <span className="font-semibold text-sm text-slate-200 tracking-wide">Centro de Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs px-1.5 py-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-500 hover:text-teal-400"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Silenciar" : "Activar sonido"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReadAll}
                className="h-7 text-xs text-slate-400 hover:text-teal-400 px-2"
              >
                <Check className="h-3 w-3 mr-1" /> Leer todas
              </Button>
            )}
          </div>
        </div>

        {/* ── Category Filter Pills ──────────────────────────── */}
        <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-slate-800/30 bg-slate-900/40 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
              !selectedCategory
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700"
            )}
          >
            Todas
          </button>
          {categories.map(([key, meta]) => {
            const CatIcon = CATEGORY_ICON_MAP[key] || Bell;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                  selectedCategory === key
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700"
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
            <div className="p-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-slate-800/50">
                <MailOpen className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Todo al día</p>
                <p className="text-xs text-slate-600 mt-0.5">No hay notificaciones {selectedCategory ? `en ${CATEGORY_META[selectedCategory]?.label}` : ""}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  {/* Date separator */}
                  <div className="px-4 py-1.5 bg-slate-900/60 border-y border-slate-800/30">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{dateLabel}</span>
                  </div>
                  {items.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 text-sm border-b border-slate-800/20",
                        "hover:bg-slate-800/20 transition-all relative group cursor-default",
                        !notif.isRead && "bg-teal-950/10 border-l-2 border-l-teal-500/50"
                      )}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-slate-800/50">
                        {getNotifIcon(notif)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-8">
                        <p className={cn("font-medium text-[13px] leading-tight", !notif.isRead ? "text-slate-200" : "text-slate-400")}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-600 font-medium tracking-wide uppercase">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                          </span>
                          {notif.link && (
                            <Link
                              href={notif.link}
                              onClick={() => { handleMarkAsRead(notif.id); setIsOpen(false); }}
                              className="text-[10px] font-semibold text-teal-500 hover:text-teal-400 transition-colors uppercase tracking-wide"
                            >
                              Ver detalles →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Actions (hover) */}
                      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        {!notif.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-teal-400 hover:bg-slate-800"
                            onClick={() => handleMarkAsRead(notif.id)}
                            title="Marcar como leída"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-red-400 hover:bg-slate-800"
                          onClick={() => handleDelete(notif.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ─────────────────────────────────────────── */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/50 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 hover:text-red-400 px-2"
              onClick={handleClearRead}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Limpiar leídas
            </Button>
            <Link
              href="/dashboard/settings/notifications"
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
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
