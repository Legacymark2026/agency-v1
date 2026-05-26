"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Bell, Mail, MessageSquare, Zap, Slack, Check, Loader2, Save,
  Users, Workflow, Bot, DollarSign, Megaphone, Calendar, FileText,
  Shield, Settings, Play, Volume2, VolumeX, SlidersHorizontal, AlertTriangle, Info,
  Briefcase, TrendingUp, ShieldAlert, Trophy, AlarmClock, HardDrive, UserMinus
} from "lucide-react";
import {
  getNotificationPreferences,
  updateNotificationPreference,
  getNotificationEvents,
  getChannelConfigs,
  updateChannelConfig
} from "@/actions/developer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { playWebAudioSound } from "@/components/dashboard/notification-listener";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Constants & Icon Maps ──────────────────────────────────────────────────

const CHANNELS = [
  { key: "EMAIL", label: "Email", icon: Mail, activeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { key: "WHATSAPP", label: "WhatsApp", icon: MessageSquare, activeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { key: "PUSH", label: "Push", icon: Zap, activeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { key: "SLACK", label: "Slack", icon: Slack, activeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
] as const;

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  // Original groups (from developer.ts keys)
  CRM: Users,
  Ventas: Trophy,
  Finanzas: DollarSign,
  Inbox: MessageSquare,
  Soporte: AlertTriangle,
  Operaciones: Briefcase,
  "Agentes IA": Bot,
  RRHH: Users,
  Marketing: Megaphone,
  Contenido: FileText,
  Equipo: Users,
  Seguridad: ShieldAlert,
  Sistema: Settings,
  // Fallback aliases
  Workflow,
  Automation: Workflow,
};

// ─── Component: Matrix Toggle Cell (Clean Icon Button) ─────────────────────

function ChannelToggle({ eventKey, channel, pref, onToggle }: {
  eventKey: string;
  channel: typeof CHANNELS[number];
  pref: { enabled: boolean; digest: string };
  onToggle: (ev: string, ch: string, enabled: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const Icon = channel.icon;

  const handlePress = async () => {
    setSaving(true);
    await onToggle(eventKey, channel.key, !pref.enabled);
    setSaving(false);
  };

  return (
    <button
      onClick={handlePress}
      disabled={saving}
      className={cn(
        "w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer relative group/btn disabled:opacity-50",
        pref.enabled
          ? channel.activeColor
          : "bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
      )}
      title={`${channel.label}: ${pref.enabled ? 'Activado' : 'Desactivado'}`}
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      
      {/* Tooltip */}
      <span className="absolute bottom-full mb-1.5 hidden group-hover/btn:block bg-slate-950 text-slate-200 border border-slate-800 text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-50 pointer-events-none">
        {channel.label}
      </span>
    </button>
  );
}

// ─── Component: Channel Configuration Card ─────────────────────────────────

function ChannelConfigForm({ cfg, initialValue }: { cfg: any, initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateChannelConfig(cfg.ch, value);
    setSaving(false);
    if (res.success) {
      toast.success(`${cfg.title} guardada exitosamente`);
    } else {
      toast.error(`No se pudo guardar la configuración de ${cfg.ch}`);
    }
  };

  return (
    <Card className="bg-slate-950 border-slate-850 shadow-xl overflow-hidden backdrop-blur-md">
      <CardHeader className="bg-slate-900/40 border-b border-slate-900/60 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <div className="p-1.5 rounded bg-slate-800 border border-slate-750">
            {cfg.icon}
          </div>
          {cfg.title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Configuración a nivel de organización/empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {cfg.fields.map((f: any) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all"
            />
          </div>
        ))}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-3 py-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 hover:border-slate-750 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-bold cursor-pointer"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, { enabled: boolean; digest: string }>>>({});
  const [events, setEvents] = useState<{ key: string; label: string; group: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});

  // Audio settings states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState("chime");
  const [soundVolume, setSoundVolume] = useState(0.3);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getNotificationPreferences();
    if (res.success) {
      setMatrix(res.data as any);
      setEvents(res.events as any);
    }

    const cfgRes = await getChannelConfigs();
    if (cfgRes.success) {
      const cfgMap: Record<string, string> = {};
      for (const c of cfgRes.data) {
        const target = c.config ? (c.config as any).target : "";
        if (c.provider === "EMAIL_NOTIFICATIONS") cfgMap["EMAIL"] = target;
        if (c.provider === "SLACK_NOTIFICATIONS") cfgMap["SLACK"] = target;
      }
      setConfigs(cfgMap);
    }

    // Load Audio config from localStorage
    if (typeof window !== "undefined") {
      setSoundEnabled(localStorage.getItem("lm_notif_sound_enabled") !== "false");
      setSoundType(localStorage.getItem("lm_notif_sound_type") || "chime");
      const vol = localStorage.getItem("lm_notif_sound_volume");
      setSoundVolume(vol ? parseFloat(vol) : 0.3);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (event: string, channel: string, enabled: boolean) => {
    const res = await updateNotificationPreference(event, channel, enabled, "IMMEDIATE");
    if (res.success) {
      setMatrix(prev => ({
        ...prev,
        [event]: { ...prev[event], [channel]: { enabled, digest: "IMMEDIATE" } },
      }));
    } else {
      toast.error("No se pudo guardar la preferencia. Intenta de nuevo.");
    }
  };

  const handleEnableAllInCategory = async (category: string, channel: string, enabled: boolean) => {
    setIsSaving(true);
    const categoryEvents = events.filter(e => e.group === category);
    await Promise.all(
      categoryEvents.map(e =>
        updateNotificationPreference(e.key, channel, enabled, matrix[e.key]?.[channel]?.digest || "IMMEDIATE")
      )
    );
    // Reload state
    const res = await getNotificationPreferences();
    if (res.success) {
      setMatrix(res.data as any);
    }
    setIsSaving(false);
    toast.success(`${category} (${channel}): preferencias actualizadas`);
  };

  const handleEnableAllGlobally = async (channel: string, enabled: boolean) => {
    setIsSaving(true);
    await Promise.all(
      events.map(e =>
        updateNotificationPreference(e.key, channel, enabled, matrix[e.key]?.[channel]?.digest || "IMMEDIATE")
      )
    );
    // Reload state
    const res = await getNotificationPreferences();
    if (res.success) {
      setMatrix(res.data as any);
    }
    setIsSaving(false);
    toast.success(`${channel}: todas las alertas ${enabled ? 'activadas' : 'desactivadas'}`);
  };

  // Audio settings handlers
  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("lm_notif_sound_enabled", String(enabled));
    toast.success(enabled ? "Sonido activado globalmente" : "Sonido silenciado globalmente");
  };

  const handleSoundTypeChange = (type: string) => {
    setSoundType(type);
    localStorage.setItem("lm_notif_sound_type", type);
    if (soundEnabled) {
      playWebAudioSound(type, soundVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    localStorage.setItem("lm_notif_sound_volume", String(vol));
  };

  const playTest = () => {
    playWebAudioSound(soundType, soundVolume);
  };

  // Group events by category
  const groups = [...new Set(events.map(e => e.group))];

  return (
    <div className="space-y-6 pb-12 pr-4 pl-4 md:pr-8 md:pl-0">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-mono w-fit">
          <Bell className="w-3.5 h-3.5" /> CENTRO DE CONFIGURACIÓN
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight mt-1">Notificaciones y Alertas</h2>
        <p className="text-slate-400 text-sm">
          Administra tus canales de notificaciones, sonidos de alerta y webhooks del sistema.
        </p>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-950 border border-slate-850 p-1.5 h-12 rounded-xl mb-6">
          <TabsTrigger value="alerts" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Preferencias</TabsTrigger>
          <TabsTrigger value="channels" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Canales</TabsTrigger>
          <TabsTrigger value="audio" className="rounded-lg py-2 font-bold uppercase tracking-wider text-xs">Configuración Audio</TabsTrigger>
        </TabsList>

        {/* ── Tab: Alerts Preferences ─────────────────────────────────── */}
        <TabsContent value="alerts" className="space-y-6 focus-visible:ring-0 focus-visible:outline-none">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-850 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Haz clic en los iconos de cada canal para activar o desactivar la alerta en ese evento específico.</span>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acción Global:</span>
              {CHANNELS.map(ch => (
                <div key={`glob-${ch.key}`} className="flex border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40 text-[10px]">
                  <span className="px-2 py-1 bg-slate-900 border-r border-slate-850 text-slate-400 font-semibold flex items-center gap-1">
                    <ch.icon className="w-3 h-3" /> {ch.label}
                  </span>
                  <button
                    onClick={() => handleEnableAllGlobally(ch.key, true)}
                    disabled={isSaving}
                    className="px-2 py-1 text-teal-400 hover:bg-teal-500/10 font-bold border-r border-slate-850 transition-colors cursor-pointer"
                  >
                    ON
                  </button>
                  <button
                    onClick={() => handleEnableAllGlobally(ch.key, false)}
                    disabled={isSaving}
                    className="px-2 py-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 font-bold transition-colors cursor-pointer"
                  >
                    OFF
                  </button>
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-sm font-mono text-slate-500">Cargando matriz de preferencias...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {groups.map(group => {
                const CatIcon = CATEGORY_ICONS[group] || Settings;
                const groupEvents = events.filter(e => e.group === group);
                return (
                  <Card key={group} className="bg-slate-950 border-slate-850 shadow-xl overflow-hidden backdrop-blur-md">
                    <CardHeader className="bg-slate-900/40 border-b border-slate-900/60 pb-3 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <CatIcon className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-200">{group}</CardTitle>
                          <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                            {groupEvents.length} eventos de alerta
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {CHANNELS.map(ch => (
                          <div key={`${group}-${ch.key}-quick`} className="flex flex-col items-center group/opt">
                            <span className="text-[9px] font-bold text-slate-600 group-hover/opt:text-slate-400 transition-colors uppercase select-none mb-1">
                              {ch.label[0]}
                            </span>
                            <div className="flex border border-slate-850 rounded bg-slate-900/80 text-[8px]">
                              <button
                                onClick={() => handleEnableAllInCategory(group, ch.key, true)}
                                className="px-1.5 py-0.5 text-teal-400 hover:bg-teal-500/10 font-bold transition-colors cursor-pointer border-r border-slate-850"
                              >
                                I
                              </button>
                              <button
                                onClick={() => handleEnableAllInCategory(group, ch.key, false)}
                                className="px-1.5 py-0.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 font-bold transition-colors cursor-pointer"
                              >
                                O
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-slate-900/60">
                      {groupEvents.map(event => (
                        <div key={event.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-900/20 transition-colors">
                          <div className="flex-1 pr-4">
                            <p className="text-xs font-semibold text-slate-200">{event.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-mono uppercase tracking-wider">{event.key.replace(/_/g, " ")}</p>
                          </div>
                          <div className="flex gap-2">
                            {CHANNELS.map(ch => {
                              const pref = matrix[event.key]?.[ch.key] || { enabled: false, digest: "IMMEDIATE" };
                              return (
                                <ChannelToggle
                                  key={`${event.key}-${ch.key}`}
                                  eventKey={event.key}
                                  channel={ch}
                                  pref={pref}
                                  onToggle={handleUpdate}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Enterprise Channels ─────────────────────────────── */}
        <TabsContent value="channels" className="focus-visible:ring-0 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                ch: "EMAIL",
                title: "Destinatario de Notificaciones de Email",
                icon: <Mail className="w-4 h-4 text-blue-400" />,
                fields: [{ label: "Email destino organizacional", placeholder: "administracion@empresa.com", type: "email" }],
              },
              {
                ch: "SLACK",
                title: "Canal de Integración de Slack",
                icon: <Slack className="w-4 h-4 text-violet-400" />,
                fields: [{ label: "Webhook URL de Slack (Incoming Webhook)", placeholder: "https://hooks.slack.com/services/...", type: "url" }],
              },
            ].map(cfg => (
              <ChannelConfigForm key={cfg.ch} cfg={cfg} initialValue={configs[cfg.ch] || ""} />
            ))}
          </div>
        </TabsContent>

        {/* ── Tab: Audio Customization ────────────────────────────────── */}
        <TabsContent value="audio" className="focus-visible:ring-0 focus-visible:outline-none">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-slate-950 border-slate-850 shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="bg-slate-900/40 border-b border-slate-900/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <div className="p-1.5 rounded bg-slate-800 border border-slate-750">
                    <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                  </div>
                  Personalización de Audio
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configura cómo deseas escuchar las alertas y notificaciones en tiempo real en la plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Enable sounds switch */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Activar Alertas Sonoras</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Habilitar la síntesis de sonidos al recibir nuevas alertas.</p>
                  </div>
                  <button
                    onClick={() => handleToggleSound(!soundEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer",
                      soundEnabled ? "bg-teal-500" : "bg-slate-850"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full bg-slate-950 transition-transform duration-200",
                      soundEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {soundEnabled && (
                  <>
                    {/* Sound Style Radio buttons */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">Estilo de Sonido</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: "chime", label: "Campana Clásica", desc: "Eco campana-resonante" },
                          { key: "tech", label: "Digital Moderno", desc: "Doble pulso rápido" },
                          { key: "soft", label: "Frecuencia Suave", desc: "Barrido sutil ascendente" },
                        ].map(s => {
                          const isSelected = soundType === s.key;
                          return (
                            <button
                              key={s.key}
                              onClick={() => handleSoundTypeChange(s.key)}
                              className={cn(
                                "flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer",
                                isSelected
                                  ? "bg-teal-500/5 border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.06)]"
                                  : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-350"
                              )}
                            >
                              <span className={cn("text-xs font-bold", isSelected ? "text-teal-400" : "text-slate-300")}>
                                {s.label}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1">{s.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400">Volumen General</label>
                        <span className="text-xs font-mono text-slate-500">{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl">
                        <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={soundVolume}
                          onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                        />
                        <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
                      </div>
                    </div>

                    {/* Sound Test Panel */}
                    <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-850 rounded-xl">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-200">Prueba de Audio</h4>
                        <p className="text-[11px] text-slate-500">Reproduce una muestra de la alerta sintetizada actual.</p>
                      </div>
                      <button
                        onClick={playTest}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-teal-500/10 active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Probar Sonido
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
