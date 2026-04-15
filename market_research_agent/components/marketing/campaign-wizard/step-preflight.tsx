'use client';

import { useCampaignWizard } from './wizard-store';
import { Button } from '@/components/ui/button';
import { validateCampaignAllPlatforms } from '@/lib/validators/platform-validators';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const PLATFORM_LABEL: Record<string, string> = {
    FACEBOOK_ADS: '📘 Meta Ads',
    GOOGLE_ADS: '🔍 Google Ads',
    TIKTOK_ADS: '🎵 TikTok Ads',
    LINKEDIN_ADS: '💼 LinkedIn Ads',
};

export function StepPreflight() {
    const {
        platforms,
        budget,
        name,
        objective,
        creative,
        targeting,
        validationResults,
        isValidating,
        setValidationResults,
        setIsValidating,
        nextStep,
        prevStep,
    } = useCampaignWizard();

    useEffect(() => {
        runValidation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runValidation() {
        setIsValidating(true);
        try {
            const results = await validateCampaignAllPlatforms({
                platform: platforms.join(','),
                budget: budget.amount,
                parameters: {
                    objective: objective,
                    title: creative.headlines?.[0] || creative.headline,
                    description: creative.descriptions?.[0] || creative.description,
                    headlines: creative.headlines,
                    descriptions: creative.descriptions,
                },
            });

            const enhancedResults = results.map(r => {
                const localErrors = [...r.errors];

                if (!targeting.customAudiences) {
                    localErrors.push({
                        field: 'Retargeting / Pixel',
                        message: 'No has enlazado un Pixel o base de CRM. Esto limitará el performance.',
                        severity: 'WARNING',
                        platform: r.platform
                    });
                }
                
                const hasInvalidCoords = targeting.locations.some(l => l.type === 'COORDINATES' && (!l.lat || !l.lng || !l.radiusKm));
                if (hasInvalidCoords) {
                    localErrors.push({
                        field: 'Coordenadas (GPS)',
                        message: 'Hay ubicaciones por coordenadas incompletas (falta lat, lng o radio).',
                        severity: 'ERROR',
                        platform: r.platform
                    });
                }

                if (budget.amount > 0 && budget.amount < 15) {
                    localErrors.push({
                        field: 'Estimador de Audiencia',
                        message: 'Presupuesto ajustado que podría derivar en un tamaño de audiencia insuficiente.',
                        severity: 'WARNING',
                        platform: r.platform
                    });
                }

                return {
                    ...r,
                    valid: localErrors.filter(e => e.severity === 'ERROR').length === 0,
                    errors: localErrors
                };
            });

            setValidationResults(enhancedResults);
        } catch (err) {
            console.error('Validation error:', err);
        } finally {
            setIsValidating(false);
        }
    }

    const allValid = validationResults.every((r) => r.valid);
    const hasWarnings = validationResults.some((r) => r.errors.some((e) => e.severity === 'WARNING'));

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">
                    {isValidating ? 'Verificando configuración...' : 'Resultados del Pre-Flight Check'}
                </h3>
                <p className="text-sm text-gray-500">
                    Verificación automática de requisitos por plataforma antes de publicar.
                </p>
            </div>

            {isValidating ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Platform Results */}
                    <div className="space-y-4">
                        {validationResults.map((result) => (
                            <div
                                key={result.platform}
                                className={`p-4 rounded-xl border ${result.valid
                                        ? 'border-emerald-500/30 bg-emerald-500/5'
                                        : 'border-red-500/30 bg-red-500/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    {result.valid ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    )}
                                    <span className="font-semibold text-white">
                                        {PLATFORM_LABEL[result.platform] ?? result.platform}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.valid
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-red-500/20 text-red-300'
                                            }`}
                                    >
                                        {result.valid ? 'Listo' : 'Requiere ajustes'}
                                    </span>
                                </div>

                                {result.errors.length > 0 && (
                                    <div className="space-y-2 ml-8">
                                        {result.errors.map((error, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                {error.severity === 'ERROR' ? (
                                                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                                                ) : (
                                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                                                )}
                                                <p className={`text-xs ${error.severity === 'ERROR' ? 'text-red-300' : 'text-yellow-300'}`}>
                                                    <span className="font-medium">{error.field}:</span> {error.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {result.valid && result.errors.length === 0 && (
                                    <p className="text-xs text-emerald-400 ml-8">
                                        ✓ Todos los requisitos cumplidos
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    {allValid && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-emerald-300 font-semibold">
                                ¡Todo listo! Tu campaña cumple todos los requisitos.
                            </p>
                            {hasWarnings && (
                                <p className="text-yellow-400 text-xs mt-1">
                                    Hay advertencias menores que puedes revisar después del lanzamiento.
                                </p>
                            )}
                        </div>
                    )}

                    {!allValid && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-red-300 font-semibold">
                                Corrige los errores indicados antes de lanzar.
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="text-gray-400 hover:text-white">
                    ← Atrás
                </Button>
                <div className="flex gap-3">
                    <Button
                        id="wizard-revalidate"
                        variant="outline"
                        onClick={runValidation}
                        disabled={isValidating}
                        className="border-white/10 text-gray-300 hover:bg-white/5"
                    >
                        {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Re-verificar
                    </Button>
                    <Button
                        id="wizard-next-step-5"
                        onClick={nextStep}
                        disabled={!allValid || isValidating}
                        className="bg-teal-700 hover:bg-teal-600 text-white px-8 h-11 disabled:opacity-40"
                    >
                        Revisar y Lanzar →
                    </Button>
                </div>
            </div>
        </div>
    );
}
