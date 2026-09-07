"use strict";
/**
 * AI Script-to-Video & Storyboard Generator Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates viral 4-act storyboards (Hook, Problem, Solution, CTA) with visual cues,
 * suggested B-Roll tags, kinetic subtitle overlays and auto-calculated timeline durations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptGeneratorService = exports.ScriptGeneratorService = void 0;
class ScriptGeneratorService {
    generateScript(input) {
        const topic = input.topic.trim();
        const duration = input.targetDurationSec || 30;
        const tone = input.tone || 'HIGH_CONVERSION';
        // Proportional division: Hook ~15%, Problem ~30%, Solution ~35%, CTA ~20%
        const hookDur = Math.max(3, Math.round(duration * 0.15));
        const problemDur = Math.round(duration * 0.30);
        const solutionDur = Math.round(duration * 0.35);
        const ctaDur = duration - hookDur - problemDur - solutionDur;
        const beats = [
            {
                phase: 'HOOK',
                startSec: 0,
                durationSec: hookDur,
                spokenNarration: `Si todavía no estás usando IA para ${topic}, estás perdiendo horas valiosas cada semana.`,
                visualPrompt: `Primer plano cinematográfico con movimiento rápido y texto en neón sobre ${topic}`,
                suggestedBrollKeyword: 'technology office fast motion',
                overlayHeadline: '🚨 EL SECRETO REVELADO',
                energyLevel: 0.98,
            },
            {
                phase: 'PROBLEM',
                startSec: hookDur,
                durationSec: problemDur,
                spokenNarration: `El 90% de los creadores y empresas intentan hacerlo manual, frustrándose con procesos lentos y costos inflados.`,
                visualPrompt: `Persona frustrada frente a pantalla de ordenador con gráficos en rojo o estrés operativo`,
                suggestedBrollKeyword: 'stressed person working laptop',
                overlayHeadline: '❌ EL GRAN ERROR',
                energyLevel: 0.85,
            },
            {
                phase: 'SOLUTION',
                startSec: hookDur + problemDur,
                durationSec: solutionDur,
                spokenNarration: `La solución es automatizar con el ecosistema de LegacyMark: un solo clic y todo el flujo queda resuelto.`,
                visualPrompt: `Dashboard elegante con métricas subiendo, gráficos interactivos e interfaz ultramoderna en modo oscuro`,
                suggestedBrollKeyword: 'data analytics success growth graph',
                overlayHeadline: '⚡ LA SOLUCIÓN DEFINITIVA',
                energyLevel: 0.92,
            },
            {
                phase: 'CTA',
                startSec: hookDur + problemDur + solutionDur,
                durationSec: ctaDur,
                spokenNarration: `Empieza hoy mismo y escala tus resultados. Comenta abajo o haz clic en el enlace para acceder.`,
                visualPrompt: `Pantalla final con logotipo de LegacyMark, botón pulsante y flecha señalando hacia abajo`,
                suggestedBrollKeyword: 'smartphone touch click subscribe',
                overlayHeadline: '👉 ACCEDE AHORA',
                energyLevel: 0.95,
            },
        ];
        const totalWords = beats.reduce((acc, b) => acc + b.spokenNarration.split(' ').length, 0);
        return {
            projectId: `proj_script_${Math.random().toString(36).substring(2, 8)}_${Date.now()}`,
            title: `Video Viral: ${topic}`,
            targetDurationSec: duration,
            wordCount: totalWords,
            beats,
            recommendedAspect: '9:16',
            suggestedBpm: tone === 'HIGH_CONVERSION' ? 128 : 110,
        };
    }
}
exports.ScriptGeneratorService = ScriptGeneratorService;
exports.scriptGeneratorService = new ScriptGeneratorService();
//# sourceMappingURL=script-generator.service.js.map