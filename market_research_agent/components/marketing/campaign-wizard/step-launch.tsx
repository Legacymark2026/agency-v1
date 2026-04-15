'use client';

import { useCampaignWizard } from './wizard-store';
import { Button } from '@/components/ui/button';
import { saveCampaignDraft, launchMultiPlatformCampaign } from '@/actions/marketing/campaign-builder';
import { CheckCircle2, XCircle, Loader2, Rocket, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PLATFORM_LABEL: Record<string, string> = {
    FACEBOOK_ADS: '📘 Meta Ads',
    GOOGLE_ADS: '🔍 Google Ads',
    TIKTOK_ADS: '🎵 TikTok Ads',
    LINKEDIN_ADS: '💼 LinkedIn Ads',
};

export function StepLaunch() {
    const {
        platforms,
        name,
        description,
        objective,
        budget,
        startDate,
        endDate,
        targeting,
        creative,
        campaignId,
        isLaunching,
        launchResults,
        setCampaignId,
        setIsLaunching,
        setLaunchResults,
        prevStep,
        reset,
    } = useCampaignWizard();

    const router = useRouter();

    async function handleLaunch() {
        setIsLaunching(true);
        try {
            // 1. Save or update the campaign draft
            const { id } = await saveCampaignDraft({
                name,
                description,
                platform: platforms.join(','),
                budget: budget.amount,
                startDate,
                endDate,
                parameters: {
                    objective,
                    bidStrategy: budget.bidStrategy,
                    bidAmount: budget.bidAmount,
                    budgetType: budget.type,
                    locations: targeting.locations.join(','),
                    interests: targeting.interests.join(','),
                    ageMin: targeting.ageMin,
                    ageMax: targeting.ageMax,
                    gender: targeting.genders[0],
                    customAudiences: targeting.customAudiences,
                    title: creative.headline,
                    description: creative.description,
                    callToAction: creative.callToAction,
                    destinationUrl: creative.destinationUrl,
                    assetUrls: creative.assetUrls,
                },
                trackingConfig: {
                    utm: creative.utmConfig,
                },
                campaignId,
            }) as { id: string; success: boolean };

            setCampaignId(id);

            // 2. Launch to all platforms simultaneously
            const results = await launchMultiPlatformCampaign(id, platforms as Parameters<typeof launchMultiPlatformCampaign>[1]);
            setLaunchResults(results);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setLaunchResults([{ platform: 'ERROR', success: false, error: message }]);
        } finally {
            setIsLaunching(false);
        }
    }

    const hasLaunched = launchResults.length > 0;
    const allSuccess = hasLaunched && launchResults.every((r) => r.success);
    const hasPartialSuccess = hasLaunched && launchResults.some((r) => r.success) && !allSuccess;

    if (hasLaunched) {
        return (
            <div className="space-y-6 text-center">
                <div className="py-6">
                    {allSuccess ? (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Rocket className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">¡Campaña Lanzada! 🚀</h3>
                            <p className="text-gray-400">Tu campaña está activa en todas las plataformas seleccionadas.</p>
                        </>
                    ) : hasPartialSuccess ? (
                        <>
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Lanzamiento Parcial</h3>
                            <p className="text-gray-400">Algunas plataformas se lanzaron con éxito. Revisa los errores abajo.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Error en el Lanzamiento</h3>
                            <p className="text-gray-400">No se pudo lanzar en ninguna plataforma. Revisa las credenciales de integración.</p>
                        </>
                    )}
                </div>

                {/* Results per platform */}
                <div className="space-y-3 text-left">
                    {launchResults.map((result) => (
                        <div
                            key={result.platform}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${result.success
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : 'border-red-500/30 bg-red-500/5'
                                }`}
                        >
                            {result.success ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                    {PLATFORM_LABEL[result.platform] ?? result.platform}
                                </p>
                                {result.externalId && (
                                    <p className="text-xs text-gray-500">ID externo: {result.externalId}</p>
                                )}
                                {result.error && (
                                    <p className="text-xs text-red-400">{result.error}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={reset}
                        className="border-white/10 text-gray-300 hover:bg-white/5"
                    >
                        Nueva Campaña
                    </Button>
                    <Button
                        id="wizard-go-to-campaigns"
                        onClick={() => router.push('/dashboard/admin/marketing/campaigns')}
                        className="bg-teal-700 hover:bg-teal-600 text-white"
                    >
                        Ver Campañas →
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Resumen de Campaign</h3>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Nombre', value: name },
                        { label: 'Objetivo', value: objective },
                        { label: 'Presupuesto', value: `$${budget.amount} ${budget.currency} / ${budget.type === 'DAILY' ? 'día' : 'total'}` },
                        { label: 'Estrategia de puja', value: budget.bidStrategy },
                        { label: 'Plataformas', value: platforms.map(p => PLATFORM_LABEL[p] ?? p).join(', ') },
                        { label: 'Ubicaciones', value: targeting.locations.join(', ') || 'No especificado' },
                    ].map(({ label, value }) => (
                        <div key={label} className="p-3 bg-white/5 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-sm font-medium text-white truncate">{value}</p>
                        </div>
                    ))}
                </div>

                {creative.headline && (
                    <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Titular del Anuncio</p>
                        <p className="text-sm font-medium text-white">{creative.headline}</p>
                    </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300">
                        Las campañas se crean en estado <strong>PAUSADO</strong> para revisión final en cada plataforma. Actívalas manualmente desde el Business Manager o desde el panel de campañas.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep} className="text-gray-400 hover:text-white" disabled={isLaunching}>
                    ← Atrás
                </Button>
                <Button
                    id="wizard-launch-campaign"
                    onClick={handleLaunch}
                    disabled={isLaunching}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-10 h-12 text-base font-semibold shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                >
                    {isLaunching ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Lanzando...
                        </>
                    ) : (
                        <>
                            <Rocket className="w-5 h-5 mr-2" /> Lanzar Campaña
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
