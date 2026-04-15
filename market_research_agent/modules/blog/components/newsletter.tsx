'use client';

import { useState, useEffect, FormEvent } from 'react';
import { X, Mail, CheckCircle2, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeToNewsletter } from '@/actions/blog';

interface NewsletterPopupProps {
    delay?: number; // Delay before showing (ms)
    exitIntent?: boolean; // Show on exit intent
}

export function NewsletterPopup({ delay = 30000, exitIntent = true }: NewsletterPopupProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if already dismissed or subscribed
        const dismissed = localStorage.getItem('newsletter_dismissed');
        const subscribed = localStorage.getItem('newsletter_subscribed');

        if (dismissed || subscribed) return;

        // Timer-based popup
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        // Exit intent detection
        const handleMouseLeave = (e: MouseEvent) => {
            if (exitIntent && e.clientY <= 0 && !dismissed && !subscribed) {
                setIsVisible(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [delay, exitIntent]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('newsletter_dismissed', Date.now().toString());
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Por favor, ingresa tu email.');
            return;
        }

        setIsSubmitting(true);

        const result = await subscribeToNewsletter(email.trim(), name.trim() || undefined, 'popup');

        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
            localStorage.setItem('newsletter_subscribed', 'true');
            setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        } else {
            setError(result.message);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                    aria-label="Cerrar"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>

                {/* Decorative Header */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 pt-10 pb-12 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell className="h-5 w-5 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-300">Newsletter</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        ¿Te gusta lo que lees?
                    </h2>
                    <p className="text-gray-300 text-sm">
                        Recibe los mejores artículos directamente en tu inbox. Sin spam, solo contenido de valor.
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 -mt-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        {isSuccess ? (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">¡Bienvenido!</h3>
                                <p className="text-gray-600 text-sm">
                                    Gracias por suscribirte. Revisa tu email para más detalles.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Tu nombre (opcional)"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="w-full"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Suscribiendo...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Suscribirme gratis
                                        </span>
                                    )}
                                </Button>

                                <p className="text-xs text-gray-500 text-center">
                                    Puedes cancelar en cualquier momento. Respetamos tu privacidad.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== INLINE NEWSLETTER FORM ====================

export function NewsletterInline() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!email.trim()) return;

        setIsSubmitting(true);
        setStatus('idle');

        const result = await subscribeToNewsletter(email.trim(), undefined, 'inline');

        setIsSubmitting(false);

        if (result.success) {
            setStatus('success');
            setMessage(result.message);
            setEmail('');
        } else {
            setStatus('error');
            setMessage(result.message);
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="font-medium">Newsletter</span>
            </div>

            <h3 className="text-xl font-bold mb-2">
                Mantente informado
            </h3>
            <p className="text-gray-300 text-sm mb-6">
                Recibe los últimos artículos y novedades en tu inbox.
            </p>

            {status === 'success' ? (
                <div className="flex items-center gap-2 p-3 bg-green-500/20 rounded-lg text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm">{message}</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />

                    {status === 'error' && (
                        <p className="text-sm text-red-400">{message}</p>
                    )}

                    <Button
                        type="submit"
                        className="w-full bg-white text-gray-900 hover:bg-gray-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Suscribiendo...' : 'Suscribirme'}
                    </Button>
                </form>
            )}
        </div>
    );
}
