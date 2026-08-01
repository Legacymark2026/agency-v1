'use client';

import { useState } from 'react';
import { ShieldCheck, QrCode, Key, Copy, Check, Lock, AlertTriangle, X } from 'lucide-react';
import { generate2FASecret, enable2FAWithToken, disable2FAForUser } from '@/actions/auth-security';
import { toast } from 'sonner';

export function TwoFactorSetupModal({ isEnabled: initialEnabled, onClose }: { isEnabled: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'IDLE' | 'SCAN' | 'BACKUP_CODES'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await generate2FASecret();
      if (res?.success) {
        setQrCodeUrl(res.data.qrCodeUrl);
        setSecret(res.data.secret);
        setStep('SCAN');
      } else {
        toast.error(res?.error || 'Error al generar código QR');
      }
    } catch {
      toast.error('Error al conectar con el servicio de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!token || token.length !== 6) {
      toast.error('Introduce el código de 6 dígitos de tu app autenticadora');
      return;
    }
    setLoading(true);
    try {
      const res = await enable2FAWithToken(secret, token);
      if (res?.success) {
        setBackupCodes(res.data.backupCodes || []);
        setIsEnabled(true);
        setStep('BACKUP_CODES');
        toast.success('Autenticación 2FA activada con éxito');
      } else {
        toast.error(res?.error || 'Código incorrecto. Verifica la hora de tu dispositivo.');
      }
    } catch {
      toast.error('Error al verificar código 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('¿Seguro que deseas desactivar la protección 2FA de tu cuenta?')) return;
    setLoading(true);
    try {
      const res = await disable2FAForUser();
      if (res?.success) {
        setIsEnabled(false);
        toast.success('Protección 2FA desactivada');
        onClose();
      } else {
        toast.error(res?.error || 'Error al desactivar 2FA');
      }
    } catch {
      toast.error('Error al procesar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    toast.success('Códigos de recuperación copiados al portapapeles');
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Autenticación de Dos Factores (2FA)</h3>
              <p className="text-xs text-slate-400">Protege tu cuenta con Google Authenticator o Authy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'IDLE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-bold">Estado de Protección</span>
                <span className={`text-sm font-black ${isEnabled ? 'text-teal-400' : 'text-slate-400'}`}>
                  {isEnabled ? '🟢 2FA Activado (Protegido)' : '🔴 2FA Desactivado'}
                </span>
              </div>
              {isEnabled ? (
                <button
                  onClick={handleDisable}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                >
                  Desactivar 2FA
                </button>
              ) : (
                <button
                  onClick={handleStartSetup}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
                >
                  Configurar 2FA
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'SCAN' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">
              Escanea este código QR con la app **Google Authenticator** o **Authy** en tu teléfono:
            </p>
            {qrCodeUrl && (
              <div className="flex justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <img src={qrCodeUrl} alt="Código QR 2FA" className="w-48 h-48 rounded-xl" />
              </div>
            )}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400 font-mono">
              Clave manual: <span className="text-teal-400 font-bold">{secret}</span>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300 block text-left">Introduce el código de 6 dígitos generado:</label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-lg font-mono px-4 py-2.5 rounded-xl text-white bg-slate-950 border border-slate-800 outline-none focus:border-teal-500/50"
              />
            </div>

            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md"
            >
              {loading ? 'Verificando...' : 'Activar Protección 2FA'}
            </button>
          </div>
        )}

        {step === 'BACKUP_CODES' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium space-y-1">
              <p className="font-bold">⚠️ Guarda estos 8 códigos de emergencia en un lugar seguro.</p>
              <p className="text-[11px] opacity-90">Te permitirán ingresar a tu cuenta si pierdes acceso a tu teléfono celular.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-bold">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={copyBackupCodes}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                {copiedCodes ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCodes ? 'Copiados' : 'Copiar Códigos'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-teal-600 hover:bg-teal-500 transition-all"
              >
                Finalizar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
