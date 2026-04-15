'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { changePassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Password strength rules ──────────────────────────────────────────────────
const RULES = [
    { id: 'length', label: 'Al menos 8 caracteres', test: (v: string) => v.length >= 8 },
    { id: 'uppercase', label: 'Una letra mayúscula', test: (v: string) => /[A-Z]/.test(v) },
    { id: 'lowercase', label: 'Una letra minúscula', test: (v: string) => /[a-z]/.test(v) },
    { id: 'number', label: 'Al menos un número', test: (v: string) => /[0-9]/.test(v) },
];

function PasswordStrengthMeter({ password }: { password: string }) {
    if (!password) return null;
    const passed = RULES.filter((r) => r.test(password)).length;
    const strength = passed === 0 ? 0 : passed === 1 ? 1 : passed <= 3 ? 2 : 3;
    const labels = ['', 'Débil', 'Media', 'Fuerte'];
    const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'];
    const textColors = ['', 'text-red-600', 'text-yellow-600', 'text-emerald-600'];

    return (
        <div className="mt-2 space-y-2">
            {/* Bar */}
            <div className="flex gap-1 h-1.5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex-1 rounded-full transition-all duration-300',
                            i <= strength ? colors[strength] : 'bg-slate-200'
                        )}
                    />
                ))}
            </div>
            {strength > 0 && (
                <p className={cn('text-xs font-medium', textColors[strength])}>
                    Seguridad: {labels[strength]}
                </p>
            )}
            {/* Rules */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                {RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                        <li key={rule.id} className="flex items-center gap-1.5 text-xs">
                            {ok ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <span className={ok ? 'text-slate-600' : 'text-slate-400'}>
                                {rule.label}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function PasswordInput({
    id,
    name,
    label,
    placeholder,
    value,
    onChange,
    autoComplete,
}: {
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    value?: string;
    onChange?: (v: string) => void;
    autoComplete?: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-sm font-medium text-slate-700">
                {label}
            </Label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    id={id}
                    name={name}
                    type={visible ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    autoComplete={autoComplete}
                    required
                    className="pl-9 pr-10 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-colors"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function ChangePasswordForm() {
    const [state, action, isPending] = useActionState(changePassword, undefined);
    const [newPassword, setNewPassword] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    // Reset form on success
    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            setNewPassword('');
        }
    }, [state?.success]);

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Cambiar Contraseña</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Usa una contraseña fuerte y única para proteger tu cuenta.
                    </p>
                </div>
            </div>

            <form ref={formRef} action={action} className="space-y-5 max-w-md">
                {/* Current password */}
                <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    label="Contraseña actual"
                    placeholder="••••••••"
                    autoComplete="current-password"
                />

                <div className="border-t border-slate-100 pt-4">
                    {/* New password */}
                    <PasswordInput
                        id="newPassword"
                        name="newPassword"
                        label="Nueva contraseña"
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={setNewPassword}
                        autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={newPassword} />
                </div>

                {/* Confirm */}
                <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirmar nueva contraseña"
                    placeholder="Repite tu nueva contraseña"
                    autoComplete="new-password"
                />

                {/* Feedback messages */}
                {state?.error && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{state.error}</span>
                    </div>
                )}

                {state?.success && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                            ✅ <strong>Contraseña actualizada.</strong> La próxima vez que inicies sesión
                            usa tu nueva contraseña.
                        </span>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-10 transition-all duration-200 disabled:opacity-60"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Actualizando…
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Actualizar Contraseña
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
