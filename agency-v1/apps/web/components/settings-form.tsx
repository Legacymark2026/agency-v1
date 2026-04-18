'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { updateSettings } from "@/actions/settings";
import { SettingsSchema } from "@/lib/schemas";
import { Loader2, User, Globe, Bell, Palette, Languages, Camera, Save, X, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import ImageUpload from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ActiveSessions } from "@/components/settings/active-sessions";
import { useFacebookPixel } from "@/hooks/use-facebook-pixel";

interface SettingsFormProps {
    initialData: {
        firstName: string;
        lastName: string;
        phone: string;
        jobTitle: string;
        bio: string;
        linkedin: string;
        github: string;
        theme: "light" | "dark" | "system";
        language: "es" | "en" | "pt";
        emailNotifications: boolean;
        image?: string | null;
        coverImage?: string | null;
        timezone?: string;
        currency?: string;
    };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
    const router = useRouter();
    const { update } = useSession();
    const { setTheme: setSystemTheme, theme: currentSystemTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const { trackCustom } = useFacebookPixel();

    const form = useForm({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            ...initialData,
            firstName: initialData.firstName || "",
            lastName: initialData.lastName || "",
            phone: initialData.phone || "",
            jobTitle: initialData.jobTitle || "",
            bio: initialData.bio || "",
            linkedin: initialData.linkedin || "",
            github: initialData.github || "",
            language: initialData.language || "es",
            image: initialData.image || null,
            coverImage: initialData.coverImage || null,
            timezone: initialData.timezone || "America/Bogota",
            currency: initialData.currency || "USD",
        },
    });

    const { isDirty } = form.formState;

    const onSubmit = async (data: any) => {
        setLoading(true);
        const toastId = toast.loading("Guardando cambios...");
        try {
            const result = await updateSettings(data);
            trackCustom("SaveSettings", { section: "Profile" });

            if (result.success) {
                await update(); // Force session update

                if (data.theme) {
                    setSystemTheme(data.theme);
                }

                toast.success("Perfil actualizado", {
                    id: toastId,
                    description: "Tus ajustes han sido guardados exitosamente."
                });
                form.reset(data); // Clear dirty state
                router.refresh();
            } else {
                toast.error("Error al guardar", { id: toastId, description: result.error });
            }
        } catch (e) {
            toast.error("Error de conexión", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative pb-10">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ajustes de Perfil</h2>
                    <p className="text-sm text-gray-500">Gestiona tus preferencias de sistema e imagen pública.</p>
                </div>
            </div>

            <div className="p-0">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                    <Tabs defaultValue="general" className="w-full">
                        <div className="px-6 pt-4 border-b border-gray-100 bg-white">
                            <TabsList className="bg-transparent h-auto p-0 flex gap-6">
                                <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 text-gray-500 data-[state=active]:text-indigo-700 bg-transparent">General</TabsTrigger>
                                <TabsTrigger value="socials" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 text-gray-500 data-[state=active]:text-indigo-700 bg-transparent">Redes Sociales</TabsTrigger>
                                <TabsTrigger value="preferences" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 text-gray-500 data-[state=active]:text-indigo-700 bg-transparent">Preferencias</TabsTrigger>
                                <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-3 pt-2 text-gray-500 data-[state=active]:text-indigo-700 bg-transparent">Seguridad y Dispositivos</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="general" className="p-6 space-y-8 animate-in fade-in duration-300">
                            {/* Sección: Información Personal */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium pb-2 border-b border-gray-100">
                                    <User size={18} className="text-gray-500" />
                                    <h3>Información Personal</h3>
                                </div>

                                {/* Portada & Avatar Upload */}
                                <div className="mb-8 relative rounded-xl h-48 bg-slate-100 border border-slate-200 overflow-hidden group">
                                    {form.watch("coverImage") ? (
                                        <img src={form.watch("coverImage")!} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-indigo-100 to-purple-100 opacity-50"></div>
                                    )}

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer">
                                            <div className="bg-white/90 backdrop-blur text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 hover:bg-white text-gray-700">
                                                <Camera size={14} /> Editar Portada
                                            </div>
                                            <div className="hidden">
                                                <ImageUpload
                                                    value={form.watch("coverImage") ? [form.watch("coverImage")!] : []}
                                                    onChange={(url) => form.setValue("coverImage", url, { shouldDirty: true })}
                                                    onRemove={() => form.setValue("coverImage", null, { shouldDirty: true })}
                                                />
                                            </div>
                                        </label>
                                    </div>

                                    <div className="absolute -bottom-6 left-6 flex items-end gap-6">
                                        <div className="shrink-0 relative">
                                            {form.watch("image") ? (
                                                <img src={form.watch("image")!} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-md">
                                                    <User className="w-10 h-10 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden z-20">
                                                    <ImageUpload
                                                        value={form.watch("image") ? [form.watch("image")!] : []}
                                                        onChange={(url) => form.setValue("image", url, { shouldDirty: true })}
                                                        onRemove={() => form.setValue("image", null, { shouldDirty: true })}
                                                    />
                                                </div>
                                                <Camera className="w-6 h-6 text-white z-10 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium">Nombre</label>
                                        <Input id="firstName" {...form.register("firstName")} placeholder="Tu nombre" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium">Apellido</label>
                                        <Input id="lastName" {...form.register("lastName")} placeholder="Tu apellido" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="jobTitle" className="text-sm font-medium">Cargo / Título</label>
                                        <Input id="jobTitle" {...form.register("jobTitle")} placeholder="Ej. Senior Dev" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
                                        <Input id="phone" {...form.register("phone")} placeholder="+57 300..." />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="bio" className="text-sm font-medium">Biografía</label>
                                        <textarea
                                            id="bio"
                                            {...form.register("bio")}
                                            className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                                            placeholder="Cuéntanos un poco sobre ti..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="socials" className="p-6 space-y-8 animate-in fade-in duration-300">
                            {/* Sección: Redes Sociales */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                                    <Globe size={18} className="text-gray-500" />
                                    <h3>Enlaces Sociales</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="linkedin" className="text-sm font-medium">LinkedIn URL</label>
                                        <Input id="linkedin" {...form.register("linkedin")} placeholder="https://linkedin.com/in/..." />
                                        {form.formState.errors.linkedin && <p className="text-xs text-red-500">{form.formState.errors.linkedin.message?.toString()}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="github" className="text-sm font-medium">GitHub URL</label>
                                        <Input id="github" {...form.register("github")} placeholder="https://github.com/..." />
                                        {form.formState.errors.github && <p className="text-xs text-red-500">{form.formState.errors.github.message?.toString()}</p>}
                                    </div>
                                </div>
                            </div>

                        </TabsContent>

                        <TabsContent value="preferences" className="p-6 space-y-10 animate-in fade-in duration-300">
                            {/* Sección: Preferencias */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                                        <Palette size={18} className="text-gray-500" />
                                        <h3>Apariencia</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="light"
                                                id="theme-light"
                                                {...form.register("theme")}
                                                className="text-black focus:ring-black"
                                            />
                                            <label htmlFor="theme-light">Claro</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="dark"
                                                id="theme-dark"
                                                {...form.register("theme")}
                                                className="text-black focus:ring-black"
                                            />
                                            <label htmlFor="theme-dark">Oscuro</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                value="system"
                                                id="theme-system"
                                                {...form.register("theme")}
                                                className="text-black focus:ring-black"
                                            />
                                            <label htmlFor="theme-system">Sistema</label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                                        <Bell size={18} className="text-gray-500" />
                                        <h3>Notificaciones</h3>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-5 items-center">
                                            <input
                                                id="email-notif"
                                                type="checkbox"
                                                {...form.register("emailNotifications")}
                                                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                        </div>
                                        <div className="text-sm">
                                            <label htmlFor="email-notif" className="font-medium text-gray-900">Notificaciones por Correo</label>
                                            <p className="text-gray-500">Recibe actualizaciones sobre actividad importante en tu cuenta.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 my-8" />

                            {/* Sección: Moneda y Zona Horaria */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium">
                                    <Languages size={18} className="text-gray-500" />
                                    <h3>Localización y Preferencias Regionales</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Configura cómo quieres que se muestren los datos en tu sistema.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label htmlFor="timezone" className="text-sm font-medium">Zona Horaria (Timezone)</label>
                                        <select
                                            id="timezone"
                                            {...form.register("timezone")}
                                            className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                                        >
                                            <option value="America/Bogota">Bogotá (GMT-5)</option>
                                            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                                            <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                                            <option value="Europe/Madrid">Madrid (GMT+1)</option>
                                            <option value="America/New_York">New York (EST)</option>
                                            <option value="UTC">UTC Universal</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="currency" className="text-sm font-medium">Moneda Predeterminada</label>
                                        <select
                                            id="currency"
                                            {...form.register("currency")}
                                            className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm bg-white"
                                        >
                                            <option value="USD">Dólar Estadounidense (USD)</option>
                                            <option value="EUR">Euro (EUR)</option>
                                            <option value="COP">Peso Colombiano (COP)</option>
                                            <option value="MXN">Peso Mexicano (MXN)</option>
                                        </select>
                                    </div>
                                </div>

                                <label className="text-sm font-medium mb-3 block">Idioma de la Interfaz</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label
                                        htmlFor="lang-es"
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${form.watch("language") === "es"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value="es"
                                            id="lang-es"
                                            {...form.register("language")}
                                            className="sr-only"
                                        />
                                        <span className="text-2xl">🇪🇸</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Español</p>
                                            <p className="text-xs text-gray-500">Spanish</p>
                                        </div>
                                    </label>

                                    <label
                                        htmlFor="lang-en"
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${form.watch("language") === "en"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value="en"
                                            id="lang-en"
                                            {...form.register("language")}
                                            className="sr-only"
                                        />
                                        <span className="text-2xl">🇺🇸</span>
                                        <div>
                                            <p className="font-medium text-gray-900">English</p>
                                            <p className="text-xs text-gray-500">Inglés</p>
                                        </div>
                                    </label>

                                    <label
                                        htmlFor="lang-pt"
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${form.watch("language") === "pt"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            value="pt"
                                            id="lang-pt"
                                            {...form.register("language")}
                                            className="sr-only"
                                        />
                                        <span className="text-2xl">🇧🇷</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Português</p>
                                            <p className="text-xs text-gray-500">Portugués</p>
                                        </div>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">
                                    ⚡ El cambio de idioma se aplicará después de guardar y recargar la página.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="security" className="p-6 space-y-10 animate-in fade-in duration-300">
                            {/* Sección: Seguridad */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-gray-900 font-medium pb-2 border-b border-gray-100">
                                    <ShieldCheck size={18} className="text-gray-500" />
                                    <h3>Seguridad y Dispositivos</h3>
                                </div>
                                <ActiveSessions />
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Sticky Save Bar */}
                    {isDirty && (
                        <div className="fixed sm:absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto sm:min-w-[400px] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                            <span className="text-sm font-medium">Tienes cambios sin guardar.</span>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => form.reset()}
                                    className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs px-3 h-8 rounded-full"
                                    disabled={loading}
                                >
                                    <X size={14} className="mr-1" /> Descartar
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-white text-slate-900 hover:bg-slate-100 text-xs px-4 h-8 rounded-full font-bold shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Save size={14} className="mr-1" />}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div >
    );
}
