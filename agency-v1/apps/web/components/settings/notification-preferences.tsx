"use client";

/**
 * components/settings/notification-preferences.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification Preferences Matrix — Per-event, per-channel configuration.
 *
 * Displays a grouped matrix of all configurable notification events
 * with toggle switches for each delivery channel (In-App, Email).
 */

import { useState, useEffect, useTransition } from "react";
import {
  Bell, Mail, Smartphone, Check, Loader2,
  Users, MessageSquare, Workflow, Bot, DollarSign,
  Megaphone, Calendar, FileText, Shield, Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/actions/notifications";
import { cn } from "@/lib/utils";

// ─── Category Icons ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreferenceMatrix {
  [eventType: string]: {
    [channel: string]: boolean;
  };
}

interface CategoryMeta {
  [key: string]: { label: string; icon: string; color: string };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<PreferenceMatrix>({});
  const [categories, setCategories] = useState<CategoryMeta>({});
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const result = await getNotificationPreferences();
    if (result.success) {
      setPreferences(result.preferences as PreferenceMatrix);
      setCategories(result.categories as CategoryMeta);
    }
    setLoading(false);
  };

  const handleToggle = (eventType: string, channel: string, enabled: boolean) => {
    // Optimistic update
    setPreferences((prev) => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [channel]: enabled,
      },
    }));

    startTransition(async () => {
      const result = await updateNotificationPreference(eventType, channel, enabled);
      if (result.success) {
        setSaved(`${eventType}:${channel}`);
        setTimeout(() => setSaved(null), 1500);
      }
    });
  };

  // Group events by category
  const groupedEvents: Record<string, { eventType: string; label: string; description: string }[]> = {};

  for (const eventType of Object.keys(preferences)) {
    const parts = eventType.split(".");
    const category = parts[0];

    if (!groupedEvents[category]) {
      groupedEvents[category] = [];
    }

    // Derive label from event type
    const label = eventType
      .split(".")
      .pop()
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || eventType;

    groupedEvents[category].push({
      eventType,
      label,
      description: "", // Filled from registry
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Cargando preferencias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-400" />
            Preferencias de Notificaciones
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configura qué notificaciones recibes y por qué canal.
          </p>
        </div>
        {isPending && (
          <Badge variant="secondary" className="bg-teal-500/20 text-teal-400 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Guardando...
          </Badge>
        )}
      </div>

      {/* Channel Legend */}
      <div className="flex items-center gap-6 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canales:</span>
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-xs text-slate-300">In-App</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs text-slate-300">Email</span>
        </div>
      </div>

      {/* Category Groups */}
      {Object.entries(groupedEvents).map(([category, events]) => {
        const meta = categories[category];
        const CatIcon = CATEGORY_ICONS[category] || Settings;
        const catColor = meta?.color || "text-slate-400";

        return (
          <Card key={category} className="bg-slate-900/30 border-slate-800/50 overflow-hidden">
            <CardHeader className="pb-3 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-800/50")}>
                  <CatIcon className={cn("h-5 w-5", catColor)} />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-200">
                    {meta?.label || category}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {events.length} evento{events.length > 1 ? "s" : ""} configurables
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-4 py-2 bg-slate-800/20 border-b border-slate-800/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Evento</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center">
                  <Bell className="h-3 w-3 mx-auto text-teal-400/60" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center">
                  <Mail className="h-3 w-3 mx-auto text-violet-400/60" />
                </span>
              </div>

              {/* Event rows */}
              {events.map(({ eventType, label }, idx) => (
                <div
                  key={eventType}
                  className={cn(
                    "grid grid-cols-[1fr_60px_60px] gap-2 px-4 py-2.5 items-center",
                    "hover:bg-slate-800/10 transition-colors",
                    idx < events.length - 1 && "border-b border-slate-800/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{label}</span>
                    {saved === `${eventType}:IN_APP` || saved === `${eventType}:EMAIL` ? (
                      <Check className="h-3 w-3 text-teal-400 animate-in fade-in" />
                    ) : null}
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={preferences[eventType]?.IN_APP ?? true}
                      onCheckedChange={(checked) => handleToggle(eventType, "IN_APP", checked)}
                      className="data-[state=checked]:bg-teal-500 scale-75"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={preferences[eventType]?.EMAIL ?? false}
                      onCheckedChange={(checked) => handleToggle(eventType, "EMAIL", checked)}
                      className="data-[state=checked]:bg-violet-500 scale-75"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
