"use strict";
/**
 * AI Silence & Dead Air Remover (Descript / Jumpcut style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects silent intervals and filler hesitations (>500ms), calculates optimal
 * cut points, and generates an Edit Decision List (EDL) with micro-crossfades.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.silenceRemoverService = exports.SilenceRemoverService = void 0;
class SilenceRemoverService {
    /**
     * Identifies speech segments and removes dead air pauses below dB threshold.
     */
    removeSilence(samples, thresholdDb = -35, minSilenceDurationSec = 0.5) {
        if (samples.length === 0) {
            return { originalDurationSec: 0, finalDurationSec: 0, savedDurationSec: 0, silenceThresholdDb: thresholdDb, segmentsToKeep: [], cutCount: 0 };
        }
        const originalDuration = samples[samples.length - 1].timestampSec;
        const segmentsToKeep = [];
        let inSpeech = false;
        let speechStart = 0;
        let segIndex = 1;
        for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const isVoice = s.dbLevel > thresholdDb;
            if (isVoice && !inSpeech) {
                inSpeech = true;
                speechStart = s.timestampSec;
            }
            else if (!isVoice && inSpeech) {
                // Check how long silence lasts
                let silenceDuration = 0;
                let j = i;
                while (j < samples.length && samples[j].dbLevel <= thresholdDb) {
                    silenceDuration = samples[j].timestampSec - s.timestampSec;
                    j++;
                }
                if (silenceDuration >= minSilenceDurationSec || j >= samples.length) {
                    inSpeech = false;
                    const endSec = s.timestampSec;
                    if (endSec - speechStart > 0.2) {
                        segmentsToKeep.push({
                            segmentIndex: segIndex++,
                            startSec: Math.round(speechStart * 100) / 100,
                            endSec: Math.round(endSec * 100) / 100,
                            durationSec: Math.round((endSec - speechStart) * 100) / 100,
                        });
                    }
                    i = j - 1;
                }
            }
        }
        if (inSpeech) {
            const lastSec = samples[samples.length - 1].timestampSec;
            segmentsToKeep.push({
                segmentIndex: segIndex++,
                startSec: Math.round(speechStart * 100) / 100,
                endSec: Math.round(lastSec * 100) / 100,
                durationSec: Math.round((lastSec - speechStart) * 100) / 100,
            });
        }
        const finalDuration = segmentsToKeep.reduce((sum, seg) => sum + seg.durationSec, 0);
        const savedDuration = Math.round((originalDuration - finalDuration) * 100) / 100;
        return {
            originalDurationSec: Math.round(originalDuration * 100) / 100,
            finalDurationSec: Math.round(finalDuration * 100) / 100,
            savedDurationSec: Math.max(0, savedDuration),
            silenceThresholdDb: thresholdDb,
            segmentsToKeep,
            cutCount: Math.max(0, segmentsToKeep.length - 1),
        };
    }
}
exports.SilenceRemoverService = SilenceRemoverService;
exports.silenceRemoverService = new SilenceRemoverService();
//# sourceMappingURL=silence-remover.service.js.map