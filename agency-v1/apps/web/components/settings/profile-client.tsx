"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SettingsSchema, type SettingsFormData } from "@/lib/schemas";
import { updateSettings, deleteAvatar } from "@/actions/settings";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/image-upload";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Calendar,
  Clock,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Sparkles,
  Download,
  Camera,
  Trash2,
  RefreshCw,
  Save,
  RotateCcw,
  Sliders,
  ExternalLink,
  Lock,
  ChevronRight,
  Info,
  CheckCircle2,
  CircleDot
} from "lucide-react";

interface ProfileClientProps {
  initialData: {
    id: string;
    email: string;
    emailVerified: boolean;
    role: string;
    globalRole: string;
    mfaEnabled: boolean;
    createdAt: string;
    companyName: string;
    connectedProviders: string[];

    firstName: string;
    lastName: string;
    phone: string;
    image?: string | null;
    coverImage?: string | null;
    jobTitle: string;
    department: string;
    bio: string;
    pronouns: string;
    country: string;
    city: string;
    status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
    statusMessage: string;
    skills: string[];

    linkedin: string;
    github: string;
    twitter: string;
    website: string;
    calendarUrl: string;

    theme: "light" | "dark" | "system";
    language: "es" | "en" | "pt" | "fr";
    timezone: string;
    currency: string;
    dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
    emailNotifications: boolean;

    profileCompletedPercentage: number;
  };
}

const TIMEZONES = [
  { value: "America/Bogota", label: "Bogotá, Lima, Quito (GMT-5)", offset: -5 },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)", offset: -6 },
  { value: "America/Santiago", label: "Santiago de Chile (GMT-4)", offset: -4 },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)", offset: -3 },
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)", offset: -3 },
  { value: "America/New_York", label: "Nueva York, Miami (GMT-5 / EDT)", offset: -4 },
  { value: "America/Los_Angeles", label: "Los Ángeles (GMT-8 / PDT)", offset: -7 },
  { value: "Europe/Madrid", label: "Madrid, Barcelona (GMT+1 / CEST)", offset: 2 },
  { value: "Europe/London", label: "Londres (GMT+0 / BST)", offset: 1 },
];

const PRESET_COVERS = [
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
  "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
  "linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)",
  "linear-gradient(135deg, #4c0519 0%, #881337 50%, #9f1239 100%)",
  "linear-gradient(135deg, #083344 0%, #0e7490 50%, #0284c7 100%)",
];

const STATUS_CONFIG = {
  ONLINE: { label: "Disponible", color: "bg-emerald-500", ring: "ring-emerald-500/20" },
  AWAY: { label: "Ausente", color: "bg-amber-500", ring: "ring-amber-500/20" },
  BUSY: { label: "En foco / No molestar", color: "bg-rose-500", ring: "ring-rose-500/20" },
  OFFLINE: { label: "Invisible", color: "bg-slate-400", ring: "ring-slate-400/20" },
};

export function ProfileClient({ initialData }: ProfileClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"general" | "presence" | "preferences" | "account">("general");
  const [skillInput, setSkillInput] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      phone: initialData.phone,
      image: initialData.image,
      coverImage: initialData.coverImage,
      jobTitle: initialData.jobTitle,
      department: initialData.department,
      bio: initialData.bio,
      pronouns: initialData.pronouns,
      country: initialData.country,
      city: initialData.city,
      status: initialData.status,
      statusMessage: initialData.statusMessage,
      skills: initialData.skills || [],
      linkedin: initialData.linkedin,
      github: initialData.github,
      twitter: initialData.twitter,
      website: initialData.website,
      calendarUrl: initialData.calendarUrl,
      theme: initialData.theme,
      language: initialData.language,
      timezone: initialData.timezone,
      currency: initialData.currency,
      dateFormat: initialData.dateFormat,
      timeFormat: initialData.timeFormat,
      emailNotifications: initialData.emailNotifications,
    },
  });

  const { isDirty } = form.formState;
  const watchedTimezone = form.watch("timezone") || "America/Bogota";
  const watchedStatus = form.watch("status") || "ONLINE";
  const watchedSkills = form.watch("skills") || [];
  const watchedFirstName = form.watch("firstName");
  const watchedLastName = form.watch("lastName");
  const watchedJobTitle = form.watch("jobTitle");
  const watchedDepartment = form.watch("department");
  const watchedAvatar = form.watch("image");
  const watchedCover = form.watch("coverImage");

  // Live timezone clock calculation
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat("es-CO", {
          timeZone: watchedTimezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: form.watch("timeFormat") !== "24h",
        }).format(now);
        setCurrentTime(formatted);
      } catch {
        setCurrentTime("--:--:--");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [watchedTimezone, form.watch("timeFormat")]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isPending) {
          form.handleSubmit(onSubmit)();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isPending, form]);

  const copyUserId = () => {
    navigator.clipboard.writeText(initialData.id);
    setCopiedId(true);
    toast.success("ID de usuario copiado al portapapeles");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const current = watchedSkills;
      if (!current.includes(skillInput.trim())) {
        form.setValue("skills", [...current, skillInput.trim()], { shouldDirty: true });
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue(
      "skills",
      watchedSkills.filter((s) => s !== skillToRemove),
      { shouldDirty: true }
    );
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("¿Deseas eliminar tu foto de perfil actual?")) return;
    const toastId = toast.loading("Eliminando foto...");
    const res = await deleteAvatar();
    if (res.success) {
      form.setValue("image", null, { shouldDirty: true });
      await update();
      toast.success("Foto eliminada correctamente", { id: toastId });
      router.refresh();
    } else {
      toast.error(res.error || "Error al eliminar foto", { id: toastId });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generando archivo oficial GDPR / Habeas Data...");
    try {
      const response = await fetch("/api/user/account/export");
      if (!response.ok) throw new Error("Error en la descarga");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `legacymark-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Descarga de datos completada con éxito", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Error al exportar datos", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    startTransition(async () => {
      const toastId = toast.loading("Guardando perfil y preferencias...");
      try {
        const result = await updateSettings(data);
        if (result.success) {
          if (data.theme) {
            setTheme(data.theme);
          }
          await update();
          form.reset(data);
          toast.success("Perfil y cuenta actualizados exitosamente", {
            id: toastId,
            description: "Todos los cambios fueron sincronizados en el sistema.",
          });
          router.refresh();
        } else {
          toast.error("Error al actualizar", { id: toastId, description: result.error });
        }
      } catch (err: any) {
        toast.error("Error de conexión al guardar", { id: toastId, description: err.message });
      }
    });
  };

  // Initials generator
  const initials = `${watchedFirstName?.[0] || ""}${watchedLastName?.[0] || ""}`.toUpperCase() || "LM";

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-28">
      {/* ─── Hero Header & Identity Card ────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-sm">
        {/* Cover Banner */}
        <div
          className="h-44 sm:h-52 w-full relative transition-all duration-500 overflow-hidden group"
          style={{
            background: watchedCover?.startsWith("linear-gradient")
              ? watchedCover
              : undefined,
            backgroundImage: watchedCover && !watchedCover.startsWith("linear-gradient")
              ? `url(${watchedCover})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!watchedCover && (
            <div className="w-full h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 opacity-90 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>
          )}

          {/* Quick Cover Palette Switcher */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-white/80 mr-1 hidden sm:inline">Temas:</span>
            {PRESET_COVERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => form.setValue("coverImage", preset, { shouldDirty: true })}
                className="w-4 h-4 rounded-full border border-white/40 hover:scale-125 transition-transform"
                style={{ background: preset }}
                title={`Tema degradado ${idx + 1}`}
              />
            ))}
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <div className="relative">
              <ImageUpload
                value={watchedCover && !watchedCover.startsWith("linear-gradient") ? [watchedCover] : []}
                onChange={(url) => form.setValue("coverImage", url, { shouldDirty: true })}
                onRemove={() => form.setValue("coverImage", null, { shouldDirty: true })}
              />
            </div>
          </div>
        </div>

        {/* Profile Info Overlay Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar with Status Badge */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-[var(--ds-surface)] shadow-xl bg-[var(--ds-surface)] relative flex items-center justify-center">
                {watchedAvatar ? (
                  <img src={watchedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-3xl font-black tracking-wider">
                    {initials}
                  </div>
                )}

                {/* Upload / Edit Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                  <div className="relative z-10 cursor-pointer text-white hover:text-indigo-300">
                    <ImageUpload
                      value={watchedAvatar ? [watchedAvatar] : []}
                      onChange={(url) => form.setValue("image", url, { shouldDirty: true })}
                      onRemove={() => form.setValue("image", null, { shouldDirty: true })}
                    />
                  </div>
                  {watchedAvatar && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors z-20"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Ring Dropdown */}
              <div className="absolute -bottom-1 -right-1 bg-[var(--ds-surface)] p-1 rounded-full shadow-md">
                <div
                  className={`w-4 h-4 rounded-full ${STATUS_CONFIG[watchedStatus].color} ring-4 ring-[var(--ds-surface)]`}
                  title={`Estado: ${STATUS_CONFIG[watchedStatus].label}`}
                />
              </div>
            </div>

            {/* Names, Roles, Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--ds-text-primary)]">
                  {watchedFirstName || watchedLastName
                    ? `${watchedFirstName || ""} ${watchedLastName || ""}`
                    : "Tu Nombre"}
                </h1>
                {initialData.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                  </span>
                )}
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                  {initialData.role}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--ds-text-secondary)] flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  {watchedJobTitle || "Cargo sin especificar"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  {initialData.companyName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {currentTime || "--:--:--"} ({watchedTimezone.split("/")[1]?.replace("_", " ")})
                </span>
              </div>
            </div>
          </div>

          {/* User ID & Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
            <button
              type="button"
              onClick={copyUserId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:border-[var(--ds-border-focus)] transition-all"
              title="Copiar ID de Usuario"
            >
              <span className="text-slate-400 font-sans">ID:</span> {initialData.id.slice(0, 8)}...
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="px-6 sm:px-8 py-3.5 bg-[var(--ds-surface-subtle)] border-t border-[var(--ds-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--ds-text-primary)]">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Nivel de Perfil:
            </div>
            <div className="w-36 sm:w-48 bg-[var(--ds-border)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${initialData.profileCompletedPercentage}%` }}
              />
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {initialData.profileCompletedPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-2 text-[var(--ds-text-muted)]">
            {initialData.profileCompletedPercentage < 100 ? (
              <span>
                💡 Sugerencia: Completa tu biografía, habilidades y activa 2FA para alcanzar el 100%.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Perfil corporativo completo!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modular Tabbed Navigation ──────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="border-b border-[var(--ds-border)] flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: "general", label: "Perfil Profesional", icon: User },
            { id: "presence", label: "Presencia & Redes", icon: Globe },
            { id: "preferences", label: "Preferencias Regionales", icon: Sliders },
            { id: "account", label: "Cuenta & Seguridad", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "border-transparent text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:border-[var(--ds-border)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ─── TAB 1: PERFIL PROFESIONAL ────────────────────────────────────── */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6 bg-[var(--ds-surface)] p-6 sm:p-8 rounded-xl border border-[var(--ds-border)] shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ds-text-primary)]">Información Básica</h3>
                  <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                    Tus nombres y datos de contacto principales visibles en la organización.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Nombre</label>
                    <input
                      {...form.register("firstName")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. Juan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Apellido</label>
                    <input
                      {...form.register("lastName")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. Pérez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Correo Corporativo</label>
                    <div className="relative">
                      <input
                        disabled
                        value={initialData.email}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] text-sm text-[var(--ds-text-muted)] cursor-not-allowed"
                      />
                      <Lock className="w-3.5 h-3.5 absolute right-3 top-3 text-[var(--ds-text-muted)]" />
                    </div>
                    <span className="text-[11px] text-[var(--ds-text-muted)]">
                      Gestionado por el administrador de la organización.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Teléfono Móvil (E.164)</label>
                    <input
                      {...form.register("phone")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Cargo / Título Profesional</label>
                    <input
                      {...form.register("jobTitle")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. VP of Engineering / Senior Solutions Architect"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Departamento</label>
                    <input
                      {...form.register("department")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. Operaciones"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">País</label>
                    <input
                      {...form.register("country")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. Colombia"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Ciudad</label>
                    <input
                      {...form.register("city")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="Ej. Bogotá D.C."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Biografía Ejecutiva</label>
                    <span className="text-[11px] text-[var(--ds-text-muted)]">
                      {(form.watch("bio") || "").length} / 500
                    </span>
                  </div>
                  <textarea
                    {...form.register("bio")}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                    placeholder="Describe brevemente tus responsabilidades, experiencia clave y áreas de interés dentro de la compañía..."
                  />
                </div>

                {/* Skills / Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Habilidades & Especialidades</label>
                  <div className="flex items-center gap-2 flex-wrap min-h-[38px] p-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)]">
                    {watchedSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Escribe y presiona Enter..."
                      className="text-xs bg-transparent border-none focus:outline-none flex-1 min-w-[140px] text-[var(--ds-text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar: Presence & Quick Status */}
              <div className="space-y-6">
                <div className="bg-[var(--ds-surface)] p-6 rounded-xl border border-[var(--ds-border)] shadow-xs space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-indigo-500" />
                    Estado de Presencia
                  </h3>
                  <div className="space-y-2">
                    {(["ONLINE", "AWAY", "BUSY", "OFFLINE"] as const).map((st) => (
                      <label
                        key={st}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          watchedStatus === st
                            ? "border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10"
                            : "border-[var(--ds-border)] hover:bg-[var(--ds-surface-subtle)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full ${STATUS_CONFIG[st].color}`} />
                          <span className="text-xs font-medium text-[var(--ds-text-primary)]">
                            {STATUS_CONFIG[st].label}
                          </span>
                        </div>
                        <input
                          type="radio"
                          value={st}
                          {...form.register("status")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Mensaje de Estado</label>
                    <input
                      {...form.register("statusMessage")}
                      placeholder="Ej. En reunión hasta las 3pm"
                      className="w-full px-3 py-1.5 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-xs text-[var(--ds-text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="bg-[var(--ds-surface)] p-6 rounded-xl border border-[var(--ds-border)] shadow-xs space-y-3">
                  <h3 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Seguridad de la Cuenta
                  </h3>
                  <p className="text-xs text-[var(--ds-text-secondary)]">
                    Tu cuenta está protegida con cifrado bcrypt y autenticación JWT con expiración dinámica.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/settings/security"
                      className="inline-flex items-center justify-between w-full p-2.5 rounded-lg bg-[var(--ds-surface-subtle)] hover:bg-[var(--ds-surface-hover)] border border-[var(--ds-border)] text-xs font-medium text-[var(--ds-text-primary)] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {initialData.mfaEnabled ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                        )}
                        2FA: {initialData.mfaEnabled ? "Activado" : "Pendiente"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: PRESENCIA & REDES + BUSINESS CARD ─────────────────────── */}
          {activeTab === "presence" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6 bg-[var(--ds-surface)] p-6 sm:p-8 rounded-xl border border-[var(--ds-border)] shadow-xs">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ds-text-primary)]">Enlaces Digitales & Redes</h3>
                  <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                    Conecta tus canales de comunicación profesional para colaboraciones directas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)] flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn
                    </label>
                    <input
                      {...form.register("linkedin")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="https://linkedin.com/in/tu-usuario"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)] flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" /> GitHub
                    </label>
                    <input
                      {...form.register("github")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="https://github.com/tu-usuario"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)] flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter / X
                    </label>
                    <input
                      {...form.register("twitter")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="https://x.com/tu-usuario"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" /> Sitio Web Personal / Portafolio
                    </label>
                    <input
                      {...form.register("website")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="https://tu-sitio-web.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ds-text-secondary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> Link de Reuniones (Calendly / Google Meet)
                    </label>
                    <input
                      {...form.register("calendarUrl")}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      placeholder="https://calendly.com/tu-reunion"
                    />
                  </div>
                </div>
              </div>

              {/* Live Digital Business Card Preview */}
              <div className="space-y-4">
                <div className="bg-[var(--ds-surface)] p-6 rounded-xl border border-[var(--ds-border)] shadow-xs">
                  <h3 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Vista Previa de Tarjeta Digital
                  </h3>

                  <div className="rounded-2xl border border-[var(--ds-border)] overflow-hidden shadow-lg bg-gradient-to-b from-[var(--ds-surface)] to-[var(--ds-surface-subtle)] p-5 space-y-4 relative">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
                        {watchedAvatar ? (
                          <img src={watchedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[var(--ds-text-primary)] truncate">
                          {watchedFirstName || watchedLastName
                            ? `${watchedFirstName || ""} ${watchedLastName || ""}`
                            : "Tu Nombre"}
                        </div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                          {watchedJobTitle || "Cargo Ejecutivo"}
                        </div>
                        <div className="text-[11px] text-[var(--ds-text-muted)] truncate">
                          {initialData.companyName}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--ds-text-secondary)] line-clamp-3 italic">
                      "{form.watch("bio") || "Sin biografía especificada."}"
                    </p>

                    <div className="pt-2 border-t border-[var(--ds-border)] flex items-center justify-between text-xs text-[var(--ds-text-muted)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {form.watch("city") || "Bogotá"}, {form.watch("country") || "Colombia"}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {currentTime || "--:--"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 3: PREFERENCIAS REGIONALES ───────────────────────────────── */}
          {activeTab === "preferences" && (
            <div className="bg-[var(--ds-surface)] p-6 sm:p-8 rounded-xl border border-[var(--ds-border)] shadow-xs space-y-6 max-w-3xl">
              <div>
                <h3 className="text-base font-semibold text-[var(--ds-text-primary)]">Ajustes Regionales y de Idioma</h3>
                <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                  Personaliza cómo se calculan las fechas, horas y monedas en tu panel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Idioma de la Interfaz</label>
                  <select
                    {...form.register("language")}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    <option value="es">Español (Latinoamérica)</option>
                    <option value="en">English (US)</option>
                    <option value="pt">Português (Brasil)</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Zona Horaria (IANA)</label>
                  <select
                    {...form.register("timezone")}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Moneda Principal</label>
                  <select
                    {...form.register("currency")}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    <option value="USD">USD ($) - Dólar Estadounidense</option>
                    <option value="COP">COP ($) - Peso Colombiano</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="MXN">MXN ($) - Peso Mexicano</option>
                    <option value="BRL">BRL (R$) - Real Brasileño</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Formato de Fecha</label>
                  <select
                    {...form.register("dateFormat")}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (Ej. 12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ds-text-secondary)]">Formato de Hora</label>
                  <select
                    {...form.register("timeFormat")}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] text-sm text-[var(--ds-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  >
                    <option value="12h">12 horas (Ej. 02:30 PM)</option>
                    <option value="24h">24 horas (Ej. 14:30)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--ds-border)] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--ds-text-primary)]">Notificaciones por Correo Electrónico</h4>
                  <p className="text-xs text-[var(--ds-text-secondary)]">Recibe resúmenes de facturación y alertas críticas.</p>
                </div>
                <input
                  type="checkbox"
                  {...form.register("emailNotifications")}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
              </div>
            </div>
          )}

          {/* ─── TAB 4: CUENTA & SEGURIDAD & HABEAS DATA ──────────────────────── */}
          {activeTab === "account" && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-[var(--ds-surface)] p-6 sm:p-8 rounded-xl border border-[var(--ds-border)] shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-[var(--ds-text-primary)]">Resumen de la Cuenta Corporativa</h3>
                  <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                    Detalles de membresía, fecha de alta y gobierno de datos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] space-y-1">
                    <span className="text-xs text-[var(--ds-text-muted)]">Organización Vinculada</span>
                    <div className="text-sm font-bold text-[var(--ds-text-primary)]">{initialData.companyName}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] space-y-1">
                    <span className="text-xs text-[var(--ds-text-muted)]">Rol en la Plataforma</span>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase">{initialData.role}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-subtle)] space-y-1">
                    <span className="text-xs text-[var(--ds-text-muted)]">Fecha de Alta</span>
                    <div className="text-sm font-bold text-[var(--ds-text-primary)]">
                      {new Date(initialData.createdAt).toLocaleDateString("es-CO", { dateStyle: "medium" })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--ds-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-500" />
                      Exportación de Datos Personales (Habeas Data / GDPR)
                    </h4>
                    <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                      Descarga una copia completa en formato JSON de tu perfil, historial de sesiones y registros de auditoría.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ds-surface-subtle)] hover:bg-[var(--ds-surface-hover)] border border-[var(--ds-border)] text-xs font-semibold text-[var(--ds-text-primary)] transition-colors shadow-xs"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                    ) : (
                      <Download className="w-4 h-4 text-indigo-500" />
                    )}
                    Exportar Datos JSON
                  </button>
                </div>
              </div>

              {/* Security Quick Link Card */}
              <div className="bg-[var(--ds-surface)] p-6 sm:p-8 rounded-xl border border-[var(--ds-border)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[var(--ds-text-primary)] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    Contraseña & Doble Autenticación (2FA)
                  </h4>
                  <p className="text-xs text-[var(--ds-text-secondary)]">
                    Configura tu contraseña, códigos de recuperación y gestiona las sesiones activas en tus dispositivos.
                  </p>
                </div>
                <Link
                  href="/dashboard/settings/security"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Gestionar Seguridad
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ─── STICKY BOTTOM SAVE BAR ──────────────────────────────────────── */}
          {isDirty && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl bg-slate-900/95 text-white backdrop-blur-md p-3.5 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-200 hidden sm:inline">
                  Tienes cambios sin guardar
                </span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
                  Ctrl + S
                </kbd>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => form.reset()}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Deshacer
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
