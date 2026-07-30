'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getEmailIntegrationConfig, saveEmailIntegrationConfig } from '@/actions/email-blast';

interface EmailConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EmailConfigModal({ isOpen, onClose }: EmailConfigModalProps) {
    const [provider, setProvider] = useState<'resend' | 'smtp'>('resend');
    const [apiKey, setApiKey] = useState('');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(587);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        getEmailIntegrationConfig()
            .then(res => {
                if (res.success && res.config) {
                    const cfg = res.config as any;
                    if (cfg.apiKey) {
                        setProvider('resend');
                        setApiKey(cfg.apiKey);
                    } else if (cfg.host) {
                        setProvider('smtp');
                        setSmtpHost(cfg.host || '');
                        setSmtpPort(cfg.port || 587);
                        setSmtpUser(cfg.user || '');
                        setSmtpPass(cfg.pass || '');
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            const configData = provider === 'resend' 
                ? { apiKey } 
                : { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass };

            const res = await saveEmailIntegrationConfig(provider, configData);
            if (res.success) {
                toast.success(res.message || 'Configuración de correo guardada');
                onClose();
            } else {
                toast.error(res.error || 'Error al guardar la configuración');
            }
        } catch {
            toast.error('Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6" style={{ background: '#0f172a', border: '1px solid rgba(30,41,59,0.8)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <span>⚙️</span> Configuración de Proveedor de Email
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Ingresa tus credenciales para enviar correos masivos directamente
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Provider Selection */}
                        <div>
                            <label className="text-xs font-bold text-slate-300 mb-2 block">Proveedor de Envío</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setProvider('resend')}
                                    className={`p-3 rounded-xl border text-left transition-all ${provider === 'resend' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                >
                                    <p className="font-bold text-sm">Resend API</p>
                                    <p className="text-xs opacity-70">3.000 emails/mes gratis</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProvider('smtp')}
                                    className={`p-3 rounded-xl border text-left transition-all ${provider === 'smtp' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                >
                                    <p className="font-bold text-sm">Servidor SMTP</p>
                                    <p className="text-xs opacity-70">Gmail, SendGrid, SMTP propio</p>
                                </button>
                            </div>
                        </div>

                        {provider === 'resend' ? (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 block">Resend API Key</label>
                                <input
                                    type="password"
                                    placeholder="re_1234567890..."
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-900 border border-slate-800 text-white focus:border-teal-500 outline-none"
                                />
                                <p className="text-[11px] text-slate-500">
                                    Obtén tu API key gratuita en <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-teal-400 underline">resend.com</a>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-300 block mb-1">Host SMTP</label>
                                        <input
                                            type="text"
                                            placeholder="smtp.gmail.com"
                                            value={smtpHost}
                                            onChange={e => setSmtpHost(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-900 border border-slate-800 text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 block mb-1">Puerto</label>
                                        <input
                                            type="number"
                                            placeholder="587"
                                            value={smtpPort}
                                            onChange={e => setSmtpPort(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-900 border border-slate-800 text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Usuario / Email</label>
                                    <input
                                        type="text"
                                        placeholder="usuario@dominio.com"
                                        value={smtpUser}
                                        onChange={e => setSmtpUser(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-slate-900 border border-slate-800 text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={smtpPass}
                                        onChange={e => setSmtpPass(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg text-sm bg-slate-900 border border-slate-800 text-white outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar Credenciales'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
