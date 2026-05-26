"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell, Users, MessageSquare, Workflow, Bot, DollarSign,
  Megaphone, Calendar, FileText, Shield, Settings, X
} from "lucide-react";
import { getNotifications, markNotificationAsRead } from "@/actions/notifications";
import { CATEGORY_META, type NotificationCategory } from "@/lib/notifications/notification-types";

// ─── Sound Synthesizer via Web Audio API ────────────────────────────────────

export function playWebAudioSound(soundType: string, volume: number = 0.3) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    if (soundType === "chime") {
      // Ringing Bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.1); // A5
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(masterGain);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440.00, now); // A4
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.3);
      osc2.stop(now + 0.9);
    } else if (soundType === "tech") {
      // Tech double beep
      const playBeep = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.12);
      };
      playBeep(now, 987.77); // B5
      playBeep(now + 0.08, 1318.51); // E6
    } else if (soundType === "soft") {
      // Soft sweeping alert
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (err) {
    console.warn("[Sound] Web Audio API blocked or not supported:", err);
  }
}

// ─── Category Icon Mapping ──────────────────────────────────────────────────

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

// ─── Legacy/Custom Notification Type Mappings ────────────────────────────────

const LEGACY_TYPE_MAP: Record<string, { category: string; icon: React.ElementType; color: string; label: string }> = {
  NEW_LEAD: { category: "CRM", icon: Users, color: "text-blue-400", label: "CRM & Ventas" },
  DEAL_WON: { category: "CRM", icon: Users, color: "text-emerald-400", label: "CRM & Ventas" },
  DEAL_LOST: { category: "CRM", icon: Users, color: "text-red-400", label: "CRM & Ventas" },
  AUTOMATION_ALERT: { category: "AUTOMATION", icon: Workflow, color: "text-red-550", label: "Automatización" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationListener() {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  // Mark notification as read via Server Action
  const handleMarkAsRead = useCallback(async (id: string) => {
    await markNotificationAsRead(id);
  }, []);

  // Request browser Notification API permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const showSystemNotification = useCallback((title: string, message: string, link?: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const notif = new Notification(title, {
        body: message,
        icon: "/favicon.ico",
      });
      if (link) {
        notif.onclick = () => {
          window.focus();
          window.location.href = link;
        };
      }
    }
  }, []);

  const triggerAlert = useCallback((notif: any) => {
    // 1. Play sound
    const soundEnabled = localStorage.getItem("lm_notif_sound_enabled") !== "false";
    const soundType = localStorage.getItem("lm_notif_sound_type") || "chime";
    const soundVolumeVal = localStorage.getItem("lm_notif_sound_volume");
    const soundVolume = soundVolumeVal ? parseFloat(soundVolumeVal) : 0.3;

    if (soundEnabled) {
      playWebAudioSound(soundType, soundVolume);
    }

    // 2. Browser native notification if tab is in background
    if (document.visibilityState === "hidden") {
      showSystemNotification(notif.title, notif.message, notif.link || undefined);
    }

    // 3. Render Custom Sonner Toast
    let CatIcon = CATEGORY_ICON_MAP[notif.type] || Bell;
    let catMeta = CATEGORY_META[notif.type as NotificationCategory];
    let categoryColor = catMeta?.color || "text-slate-400";
    let categoryLabel = catMeta?.label || notif.type;

    const legacy = LEGACY_TYPE_MAP[notif.type];
    if (legacy) {
      CatIcon = legacy.icon;
      categoryColor = legacy.color;
      categoryLabel = legacy.label;
    }

    toast.custom(
      (t) => (
        <div className="flex w-full items-start gap-3.5 p-4 rounded-xl border border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl text-slate-100 animate-in slide-in-from-right-5 duration-300 pointer-events-auto">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-850 shrink-0">
            <CatIcon className={`h-5 w-5 ${categoryColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-teal-400 tracking-wider uppercase">
              {categoryLabel}
            </span>
            <h4 className="text-sm font-bold text-slate-200 mt-0.5 truncate">{notif.title}</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
            <div className="flex gap-2 mt-3.5">
              {notif.link && (
                <a
                  href={notif.link}
                  onClick={() => {
                    toast.dismiss(t);
                    handleMarkAsRead(notif.id);
                  }}
                  className="px-3 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-bold transition-colors uppercase tracking-wider"
                >
                  Ver detalles
                </a>
              )}
              <button
                onClick={() => {
                  toast.dismiss(t);
                  handleMarkAsRead(notif.id);
                }}
                className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-800 hover:border-slate-750 transition-colors uppercase tracking-wider"
              >
                Ignorar
              </button>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-1 hover:bg-slate-900 rounded"
          >
            <X size={14} />
          </button>
        </div>
      ),
      { duration: 6000 }
    );
  }, [showSystemNotification, handleMarkAsRead]);

  const pollNewNotifications = useCallback(async () => {
    try {
      const result = await getNotifications({ take: 10 });
      if (!result.success || !result.data) return;

      const currentIds = new Set<string>();

      // Filter unread notifications
      const unreadAlerts = result.data.filter((n: any) => !n.isRead);

      if (isFirstLoadRef.current) {
        // Feed the initial unread notifications to avoid toasting old history
        unreadAlerts.forEach((n: any) => seenIdsRef.current.add(n.id));
        isFirstLoadRef.current = false;
        return;
      }

      // Check for any new unread notification
      unreadAlerts.forEach((n: any) => {
        currentIds.add(n.id);
        if (!seenIdsRef.current.has(n.id)) {
          seenIdsRef.current.add(n.id);
          triggerAlert(n);
        }
      });

      // Cleanup seen IDs list to save memory
      seenIdsRef.current.forEach((id) => {
        if (!currentIds.has(id)) {
          seenIdsRef.current.delete(id);
        }
      });
    } catch (error) {
      console.warn("[NotificationListener] Polling failed:", error);
    }
  }, [triggerAlert]);

  useEffect(() => {
    pollNewNotifications(); // initial check
    const interval = setInterval(pollNewNotifications, 12000); // Check every 12 seconds
    return () => clearInterval(interval);
  }, [pollNewNotifications]);

  return null; // Invisible component
}
