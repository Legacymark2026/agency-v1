"use client";

import { useState, useTransition } from "react";
import { 
    Shield, ShieldCheck, ShieldAlert, Key, Lock, Smartphone, 
    Monitor, Laptop, CheckCircle2, AlertTriangle, Download, 
    Copy, Check, RefreshCw, LogOut, Power, Eye, EyeOff, 
    X, ArrowRight, Loader2, Sparkles, FileText, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
    initiateTotpSetup, 
    confirmAndEnableTotp, 
    disableTotp, 
    generateFreshBackupCodes,
    revokeSession, 
    revokeAllOtherSessions, 
    emergencyLockdown 
} from "@/actions/settings";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { playUiSound } from "@/lib/stores/ui-store";

interface SecurityOverview {
    id: string;
    email: string;
    hasPassword: boolean;
    mfaEnabled: boolean;
    hasBackupCodes: boolean;
    unspentCodesCount: number;
    emailVerified: boolean;
    activeSessionsCount: number;
    recentFailedAttemptsCount: number;
    securityScore: number;
    securityGrade: "A+" | "A" | "B" | "C" | "D";
    checklist: Array<{
        id: string;
        title: string;
        description: string;
        status: "passed" | "warning" | "alert" | "neutral";
        impact: string;
    }>;
    createdAt: string;
}

interface SessionItem {
    id: string;
    sessionToken: string;
    ipAddress: string | null;
    userAgent: string | null;
    expires: string;
}

interface LoginLogItem {
    id: string;
    date: Date | string;
    action: string;
    ip: string;
    userAgent: string;
    status: string;
}

interface PersonalSecurityClientProps {
    overview: SecurityOverview;
    sessions: SessionItem[];
    logs: LoginLogItem[];
    currentSessionToken?: string;
}

export function PersonalSecurityClient({ 
    overview: initialOverview, 
    sessions: initialSessions, 
    logs: initialLogs, 
    currentSessionToken 
}: PersonalSecurityClientProps) {
    const router = useRouter();
    const [overview, setOverview] = useState<SecurityOverview>(initialOverview);
    const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
    const [logs, setLogs] = useState<LoginLogItem[]>(initialLogs);
    const [isPending, startTransition] = useTransition();

    // 2FA Setup Flow State
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);
    const [totpSecret, setTotpSecret] = useState("");
    const [totpQrCode, setTotpQrCode] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    // Backup Codes Flow State
    const [revealedBackupCodes, setRevealedBackupCodes] = useState<string[]>([]);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);

    // Disable 2FA Flow State
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [isDisabling, setIsDisabling] = useState(false);

    // Active Sessions State
    const [isRevokingAll, setIsRevokingAll] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Audit Log Filter
    const [logFilter, setLogFilter] = useState<"all" | "success" | "failed">("all");

    // ── Helper: Parse User Agent ──
    const parseUserAgent = (ua: string | null) => {
        if (!ua) return { device: "Dispositivo Seguro", browser: "Navegador Web", icon: Laptop };
        let device = "Escritorio (PC/Mac)";
        let icon = Monitor;
        if (/mobile|iphone|android/i.test(ua)) { device = "Dispositivo Móvil"; icon = Smartphone; }
        else if (/ipad|tablet/i.test(ua)) { device = "Tablet"; icon = Laptop; }

        let browser = "Navegador Web";
        if (/edg/i.test(ua)) browser = "Microsoft Edge";
        else if (/chrome/i.test(ua)) browser = "Google Chrome";
        else if (/firefox/i.test(ua)) browser = "Mozilla Firefox";
        else if (/safari/i.test(ua)) browser = "Apple Safari";

        return { device, browser, icon };
    };

    // ── 2FA Setup Flow ──
    const handleStartTotpSetup = async () => {
        setIsGeneratingQr(true);
        playUiSound('click');
        try {
            const res = await initiateTotpSetup();
            if (res.success && res.secret && res.qrCode) {
                setTotpSecret(res.secret);
                setTotpQrCode(res.qrCode);
                setTotpCode("");
                setIsSetupModalOpen(true);
            } else {
                toast.error(res.error || "No se pudo generar la clave TOTP");
            }
        } catch (e: any) {
            toast.error("Error al iniciar configuración 2FA");
        } finally {
            setIsGeneratingQr(false);
        }
    };

    const handleConfirmTotp = async () => {
        if (!totpCode || totpCode.length !== 6) {
            toast.error("Por favor ingresa el código de 6 dígitos.");
            return;
        }

        setIsVerifyingTotp(true);
        playUiSound('click');
        try {
            const res = await confirmAndEnableTotp(totpCode, totpSecret);
            if (res.success && res.backupCodes) {
                playUiSound('success');
                toast.success("¡Autenticación de 2 Factores (2FA) activada con éxito!");
                setRevealedBackupCodes(res.backupCodes);
                setIsSetupModalOpen(false);
                setIsBackupModalOpen(true);
                setOverview(prev => ({
                    ...prev,
                    mfaEnabled: true,
                    hasBackupCodes: true,
                    unspentCodesCount: res.backupCodes.length,
                    securityScore: Math.min(100, prev.securityScore + 35)
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Código inválido o expirado");
            }
        } catch (e: any) {
            toast.error("Error al verificar código");
        } finally {
            setIsVerifyingTotp(false);
        }
    };

    const handleDisableTotp = async () => {
        setIsDisabling(true);
        playUiSound('click');
        try {
            const res = await disableTotp(disablePassword);
            if (res.success) {
                playUiSound('toggle');
                toast.success("2FA desactivado correctamente");
                setIsDisableModalOpen(false);
                setDisablePassword("");
                setOverview(prev => ({
                    ...prev,
                    mfaEnabled: false,
                    hasBackupCodes: false,
                    unspentCodesCount: 0,
                    securityScore: Math.max(0, prev.securityScore - 35)
                }));
                router.refresh();
            } else {
                toast.error(res.error || "Error al desactivar 2FA");
            }
        } catch (e: any) {
            toast.error("Error al procesar solicitud");
        } finally {
            setIsDisabling(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        setIsRegeneratingCodes(true);
        playUiSound('click');
        try {
            const res = await generateFreshBackupCodes();
            if (res.success && res.backupCodes) {
                playUiSound('success');
                setRevealedBackupCodes(res.backupCodes);
                setIsBackupModalOpen(true);
                toast.success("Nuevos códigos de recuperación generados con éxito");
                setOverview(prev => ({
                    ...prev,
                    hasBackupCodes: true,
                    unspentCodesCount: res.backupCodes.length
                }));
            } else {
                toast.error(res.error || "Error al generar códigos");
            }
        } catch (e: any) {
            toast.error("Error al regenerar códigos");
        } finally {
            setIsRegeneratingCodes(false);
        }
    };

    // ── Session Revocation ──
    const handleRevokeSingleSession = async (id: string, isCurrent: boolean) => {
        if (isCurrent) {
            toast.error("No puedes revocar tu sesión activa actual desde aquí.");
            return;
        }

        setRevokingId(id);
        playUiSound('click');
        try {
            const res = await revokeSession(id);
            if (res.success) {
                toast.success("Sesión revocada y dispositivo desconectado");
                setSessions(prev => prev.filter(s => s.id !== id));
            } else {
                toast.error(res.error || "Error al revocar sesión");
            }
        } catch {
            toast.error("Error al revocar sesión");
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeAllOther = async () => {
        setIsRevokingAll(true);
        playUiSound('click');
        try {
            const res = await revokeAllOtherSessions(currentSessionToken);
            if (res.success) {
                playUiSound('success');
                toast.success("Todas las demás sesiones han sido cerradas exitosamente");
                setSessions(prev => prev.filter(s => s.sessionToken === currentSessionToken));
            } else {
                toast.error(res.error || "Error al revocar sesiones");
            }
        } catch {
            toast.error("Error al revocar sesiones");
        } finally {
            setIsRevokingAll(false);
        }
    };

    const handleEmergencyLockdown = async () => {
        if (!confirm("¿Estás seguro de que deseas activar el Bloqueo de Emergencia? Se cerrarán todas las sesiones en todos los dispositivos de inmediato.")) {
            return;
        }

        playUiSound('reset');
        try {
            const res = await emergencyLockdown();
            if (res.success) {
                toast.success("Bloqueo de Emergencia ejecutado. Redirigiendo al login...");
                setTimeout(() => {
                    window.location.href = "/auth/login";
                }, 1200);
            }
        } catch {
            toast.error("Error al ejecutar bloqueo de emergencia");
        }
    };

    const downloadBackupCodesFile = () => {
        const text = `===================================================\nLEGACYMARK SAS — CÓDIGOS DE RECUPERACIÓN (2FA)\nGenerado el: ${new Date().toLocaleString()}\nUsuario: ${overview.email}\n===================================================\n\n${revealedBackupCodes.map((c, i) => `[${i + 1}] ${c}`).join("\n")}\n\nIMPORTANTE: Cada código solo puede utilizarse una única vez.\nGuarda este archivo en un gestor seguro de contraseñas.\n===================================================`;
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `legacymark-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Archivo de códigos de respaldo descargado");
    };

    const copyBackupCodesToClipboard = () => {
        navigator.clipboard.writeText(revealedBackupCodes.join("\n"));
        toast.success("Códigos copiados al portapapeles");
    };

    // Filtered logs
    const filteredLogs = logs.filter(l => {
        if (logFilter === "success") return l.status === "success";
        if (logFilter === "failed") return l.status === "failed";
        return true;
    });

    const getGradeBadge = (grade: string) => {
        switch (grade) {
            case "A+": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
            case "A": return "bg-teal-500/15 text-teal-400 border-teal-500/30";
            case "B": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
            case "C": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
            default: return "bg-rose-500/15 text-rose-400 border-rose-500/30";
        }
    };

    return (
        <div className="space-y-8 pb-16">

            {/* ══════════════════════════════════════════════════════════
                1. PERSONAL SECURITY SCORECARD & AUDIT
            ══════════════════════════════════════════════════════════ */}
            <div className="relative p-6 rounded-[var(--radius)] border border-[var(--ds-border-glow)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)] overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--ds-teal-dim)] rounded-full blur-3xl pointer-events-none -z-10" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[var(--ds-border)]">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--ds-teal)] font-bold mb-1.5 uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" /> AUDITORÍA DE SEGURIDAD PERSONAL
                        </div>
                        <h2 className="text-xl font-bold text-[var(--ds-text-primary)]">Postura y Salud de Seguridad</h2>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                            Evaluación criptográfica de factores de autenticación, sesiones y vectores de acceso a tu cuenta.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-black font-mono text-[var(--ds-text-primary)]">
                                {overview.securityScore}<span className="text-sm font-normal text-[var(--ds-text-muted)]">/100</span>
                            </div>
                            <div className="text-[10px] font-mono text-[var(--ds-text-dim)] uppercase">Puntuación Global</div>
                        </div>

                        <span className={`text-lg font-mono font-black px-3.5 py-1 rounded-[var(--radius)] border ${getGradeBadge(overview.securityGrade)}`}>
                            {overview.securityGrade}
                        </span>
                    </div>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full h-2 bg-[var(--ds-surface-2)] rounded-full overflow-hidden mt-6 border border-[var(--ds-border)]">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 via-[var(--ds-teal)] to-[var(--ds-teal-bright)] transition-all duration-700" 
                        style={{ width: `${overview.securityScore}%` }}
                    />
                </div>

                {/* Vector Checklist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {overview.checklist.map((item) => (
                        <div 
                            key={item.id} 
                            className="p-3.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)]/40 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-bold text-[var(--ds-text-primary)] truncate">{item.title}</span>
                                    {item.status === "passed" ? (
                                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                                            <CheckCircle2 className="w-3 h-3" /> OK
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                                            <AlertTriangle className="w-3 h-3" /> PENDIENTE
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-[var(--ds-text-muted)] leading-relaxed">{item.description}</p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-[var(--ds-border)]/50 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-[var(--ds-text-dim)]">Impacto: {item.impact}</span>
                                {item.id === "mfa" && !overview.mfaEnabled && (
                                    <button 
                                        onClick={handleStartTotpSetup}
                                        className="text-[var(--ds-teal)] hover:underline font-bold cursor-pointer"
                                    >
                                        Activar ahora →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                2. TWO-FACTOR AUTHENTICATION (2FA / TOTP)
            ══════════════════════════════════════════════════════════ */}
            <div className="p-6 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--ds-border)]">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-[var(--radius)] border ${
                            overview.mfaEnabled 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-bold text-[var(--ds-text-primary)]">
                                    Autenticación de Dos Factores (2FA / TOTP)
                                </h3>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                    overview.mfaEnabled 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                }`}>
                                    {overview.mfaEnabled ? "PROTEGIDO" : "NO CONFIGURADO"}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--ds-text-secondary)] max-w-xl">
                                Protege tus operaciones exigiendo un código temporal generado por una aplicación autenticadora estándar (RFC 6238) como Google Authenticator, Microsoft Authenticator o 1Password al iniciar sesión.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {overview.mfaEnabled ? (
                            <>
                                <button
                                    onClick={handleRegenerateBackupCodes}
                                    disabled={isRegeneratingCodes}
                                    className="px-4 py-2 text-xs font-semibold rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] hover:bg-[var(--ds-surface-2)]/80 text-[var(--ds-text-primary)] transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    {isRegeneratingCodes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5 text-[var(--ds-teal)]" />}
                                    Ver Códigos de Respaldo
                                </button>
                                <button
                                    onClick={() => setIsDisableModalOpen(true)}
                                    className="px-4 py-2 text-xs font-semibold rounded-[var(--radius)] border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                                >
                                    Desactivar 2FA
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleStartTotpSetup}
                                disabled={isGeneratingQr}
                                className="px-5 py-2.5 text-xs font-bold rounded-[var(--radius)] bg-[var(--ds-teal)] hover:opacity-90 text-white shadow-[var(--ds-shadow-teal)] transition-all cursor-pointer flex items-center gap-2"
                            >
                                {isGeneratingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Configurar 2FA Ahora
                            </button>
                        )}
                    </div>
                </div>

                {overview.mfaEnabled && (
                    <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ds-text-muted)] font-mono">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Algoritmo HMAC-SHA1 RFC 6238 en ejecución (Período: 30s)
                        </span>
                        <span>Códigos de respaldo restantes: {overview.unspentCodesCount} / 10</span>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                3. PASSWORD MANAGEMENT
            ══════════════════════════════════════════════════════════ */}
            <div className="p-6 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)]">
                <div className="flex items-center gap-3 pb-5 mb-5 border-b border-[var(--ds-border)]">
                    <div className="p-2.5 rounded-[var(--radius)] bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-[var(--ds-teal)]">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--ds-text-primary)]">Actualización de Contraseña</h3>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                            Tu contraseña se almacena con cifrado unidireccional bcrypt con factor de coste 12.
                        </p>
                    </div>
                </div>

                <ChangePasswordForm />
            </div>

            {/* ══════════════════════════════════════════════════════════
                4. ACTIVE DEVICES & SESSIONS
            ══════════════════════════════════════════════════════════ */}
            <div className="p-6 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[var(--ds-border)]">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[var(--ds-text-primary)]">Dispositivos y Sesiones Activas</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ds-teal-dim)] text-[var(--ds-teal)] border border-[var(--ds-border-glow)] font-bold">
                                {sessions.length} activas
                            </span>
                        </div>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                            Administra los navegadores y terminales autorizadas que tienen una sesión abierta con tu cuenta.
                        </p>
                    </div>

                    {sessions.length > 1 && (
                        <button
                            onClick={handleRevokeAllOther}
                            disabled={isRevokingAll}
                            className="px-3.5 py-2 rounded-[var(--radius)] border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                            {isRevokingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                            Cerrar todas las demás sesiones
                        </button>
                    )}
                </div>

                <div className="divide-y divide-[var(--ds-border)]/60">
                    {sessions.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[var(--ds-text-muted)]">
                            No se registran sesiones activas adicionales en la base de datos.
                        </div>
                    ) : (
                        sessions.map((s) => {
                            const { device, browser, icon: DeviceIcon } = parseUserAgent(s.userAgent);
                            const isCurrent = s.sessionToken === currentSessionToken;

                            return (
                                <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--ds-surface-2)]/20 px-2 rounded-[var(--radius)] transition-colors">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 rounded-[var(--radius)] bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-[var(--ds-teal)]">
                                            <DeviceIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-[var(--ds-text-primary)]">{browser} en {device}</span>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                        Sesión Actual
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--ds-text-muted)] mt-0.5">
                                                <span>IP: {s.ipAddress || "Confidencial"}</span>
                                                <span>•</span>
                                                <span>Expira: {new Date(s.expires).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrent && (
                                        <button
                                            onClick={() => handleRevokeSingleSession(s.id, isCurrent)}
                                            disabled={revokingId === s.id}
                                            className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-semibold cursor-pointer shrink-0"
                                        >
                                            {revokingId === s.id ? "Revocando..." : "Desconectar"}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                5. SECURITY AUDIT LOG / HISTORIAL DE ACCESOS
            ══════════════════════════════════════════════════════════ */}
            <div className="p-6 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] backdrop-blur-md shadow-[var(--ds-shadow-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[var(--ds-border)]">
                    <div>
                        <h3 className="text-base font-bold text-[var(--ds-text-primary)]">Historial de Accesos & Eventos de Seguridad</h3>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5">
                            Registro de auditoría inmutable de autenticaciones, revocaciones y cambios en tu cuenta.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-[var(--radius)] bg-[var(--ds-surface-2)] p-0.5 border border-[var(--ds-border)]">
                            <button
                                onClick={() => setLogFilter("all")}
                                className={`px-2.5 py-1 text-xs rounded-[var(--radius)] transition-all cursor-pointer ${logFilter === "all" ? "bg-[var(--ds-surface)] text-[var(--ds-text-primary)] font-bold shadow-sm" : "text-[var(--ds-text-muted)]"}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setLogFilter("success")}
                                className={`px-2.5 py-1 text-xs rounded-[var(--radius)] transition-all cursor-pointer ${logFilter === "success" ? "bg-[var(--ds-surface)] text-emerald-400 font-bold shadow-sm" : "text-[var(--ds-text-muted)]"}`}
                            >
                                Exitosos
                            </button>
                            <button
                                onClick={() => setLogFilter("failed")}
                                className={`px-2.5 py-1 text-xs rounded-[var(--radius)] transition-all cursor-pointer ${logFilter === "failed" ? "bg-[var(--ds-surface)] text-rose-400 font-bold shadow-sm" : "text-[var(--ds-text-muted)]"}`}
                            >
                                Fallidos / Alertas
                            </button>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-[var(--ds-border)]/60">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[var(--ds-text-muted)]">
                            No se encontraron registros bajo el filtro seleccionado.
                        </div>
                    ) : (
                        filteredLogs.slice(0, 15).map((log) => (
                            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === "success" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]"}`} />
                                    <div>
                                        <div className="font-mono font-semibold text-[var(--ds-text-primary)]">{log.action}</div>
                                        <div className="text-[11px] text-[var(--ds-text-muted)] line-clamp-1">{log.userAgent}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--ds-text-dim)] shrink-0">
                                    <span>IP: {log.ip}</span>
                                    <span>{new Date(log.date).toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                6. EMERGENCY LOCKDOWN & DANGER ZONE
            ══════════════════════════════════════════════════════════ */}
            <div className="p-6 rounded-[var(--radius)] border border-rose-500/30 bg-rose-950/10 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-rose-400 font-bold mb-1.5 uppercase">
                            <Power className="w-4 h-4" /> RESGUARDO CRÍTICO & BLOQUEO
                        </div>
                        <h3 className="text-base font-bold text-[var(--ds-text-primary)]">Cierre Preventivo de Emergencia</h3>
                        <p className="text-xs text-[var(--ds-text-secondary)] mt-0.5 max-w-xl">
                            Si sospechas que tu dispositivo o credenciales han sido comprometidos, pulsa para revocar de inmediato el 100% de las sesiones y desconectar todos los accesos en red.
                        </p>
                    </div>

                    <button
                        onClick={handleEmergencyLockdown}
                        className="px-5 py-2.5 rounded-[var(--radius)] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all cursor-pointer shrink-0"
                    >
                        Ejecutar Bloqueo de Emergencia
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODAL: 2FA SETUP (QR + SECRET)
            ══════════════════════════════════════════════════════════ */}
            {isSetupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md p-6 rounded-[var(--radius)] border border-[var(--ds-border-glow)] bg-[var(--ds-surface)] shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-[var(--ds-text-primary)] flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-[var(--ds-teal)]" />
                                Configurar App Autenticadora
                            </h3>
                            <button onClick={() => setIsSetupModalOpen(false)} className="text-[var(--ds-text-muted)] hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-xs text-[var(--ds-text-secondary)] space-y-2">
                            <p><strong>Paso 1:</strong> Abre Google Authenticator, Microsoft Authenticator o 1Password y escanea este código QR:</p>
                        </div>

                        {totpQrCode && (
                            <div className="flex justify-center p-4 bg-white rounded-[var(--radius)] shadow-inner">
                                <img src={totpQrCode} alt="Código QR 2FA" className="w-44 h-44" />
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] text-[var(--ds-text-muted)] mb-1">O ingresa esta clave secreta manualmente en tu app:</p>
                            <div className="flex items-center gap-2 p-2 rounded-[var(--radius)] bg-[var(--ds-surface-2)] border border-[var(--ds-border)] text-xs font-mono">
                                <span className="flex-1 truncate select-all">{totpSecret}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(totpSecret);
                                        setCopiedSecret(true);
                                        setTimeout(() => setCopiedSecret(false), 2000);
                                        toast.success("Clave secreta copiada");
                                    }}
                                    className="text-[var(--ds-teal)] hover:underline font-semibold cursor-pointer shrink-0"
                                >
                                    {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[var(--ds-border)]">
                            <label className="text-xs font-bold text-[var(--ds-text-primary)]">
                                Paso 2: Ingresa el código de 6 dígitos que muestra tu app
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                                className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] focus:outline-none focus:border-[var(--ds-teal-bright)]"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsSetupModalOpen(false)}
                                className="flex-1 py-2.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-xs font-semibold text-[var(--ds-text-primary)] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmTotp}
                                disabled={isVerifyingTotp || totpCode.length !== 6}
                                className="flex-1 py-2.5 rounded-[var(--radius)] bg-[var(--ds-teal)] hover:opacity-90 text-white text-xs font-bold shadow-[var(--ds-shadow-teal)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {isVerifyingTotp ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Validar & Activar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                MODAL: BACKUP CODES REVEAL
            ══════════════════════════════════════════════════════════ */}
            {isBackupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md p-6 rounded-[var(--radius)] border border-[var(--ds-border-glow)] bg-[var(--ds-surface)] shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-[var(--ds-text-primary)] flex items-center gap-2">
                                <Key className="w-5 h-5 text-[var(--ds-teal)]" />
                                Códigos de Respaldo de Emergencia
                            </h3>
                            <button onClick={() => setIsBackupModalOpen(false)} className="text-[var(--ds-text-muted)] hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-xs text-[var(--ds-text-secondary)] space-y-1">
                            <p>Guarda estos 10 códigos en un lugar seguro. Cada uno te permitirá acceder a tu cuenta si pierdes tu dispositivo de autenticación.</p>
                            <p className="text-amber-400 font-medium">Cada código funciona una sola vez.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-4 rounded-[var(--radius)] bg-[var(--ds-surface-2)] border border-[var(--ds-border)] font-mono text-xs font-bold text-[var(--ds-teal)]">
                            {revealedBackupCodes.map((code, i) => (
                                <div key={i} className="p-1.5 rounded bg-[var(--ds-surface)] border border-[var(--ds-border)]/60 text-center">
                                    {code}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={copyBackupCodesToClipboard}
                                className="flex-1 py-2.5 rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-xs font-semibold text-[var(--ds-text-primary)] cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Copy className="w-4 h-4" /> Copiar
                            </button>
                            <button
                                type="button"
                                onClick={downloadBackupCodesFile}
                                className="flex-1 py-2.5 rounded-[var(--radius)] bg-[var(--ds-teal)] hover:opacity-90 text-white text-xs font-bold shadow-[var(--ds-shadow-teal)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Download className="w-4 h-4" /> Descargar TXT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                MODAL: DISABLE 2FA CONFIRMATION
            ══════════════════════════════════════════════════════════ */}
            {isDisableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm p-6 rounded-[var(--radius)] border border-rose-500/30 bg-[var(--ds-surface)] shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[var(--ds-border)] pb-3">
                            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Desactivar 2FA
                            </h3>
                            <button onClick={() => setIsDisableModalOpen(false)} className="text-[var(--ds-text-muted)] hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-[var(--ds-text-secondary)]">
                            Al desactivar la autenticación de dos factores, tu cuenta perderá una capa crítica de resguardo y tu puntuación de seguridad disminuirá.
                        </p>

                        {overview.hasPassword && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-[var(--ds-text-primary)]">Confirma tu contraseña:</label>
                                <input
                                    type="password"
                                    placeholder="Tu contraseña actual"
                                    value={disablePassword}
                                    onChange={(e) => setDisablePassword(e.target.value)}
                                    className="w-full py-2 px-3 text-xs rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)]"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsDisableModalOpen(false)}
                                className="flex-1 py-2 text-xs rounded-[var(--radius)] border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleDisableTotp}
                                disabled={isDisabling}
                                className="flex-1 py-2 text-xs font-bold rounded-[var(--radius)] bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {isDisabling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
