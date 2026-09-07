"use strict";
/**
 * AI Voice Isolation & Broadcast Audio Enhancement Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates advanced FFmpeg audio filtering graphs for studio-quality vocal clarity:
 * - FFT-based dynamic noise suppression (afftdn)
 * - Vocal bandpass frequency shaping (80Hz - 12kHz)
 * - Vocal dynamics compressor for consistent speech level
 * - Broadcast standard loudness normalization (EBU R128 / ITU-R BS.1770-4)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceIsolationService = exports.VoiceIsolationService = void 0;
class VoiceIsolationService {
    enhanceVoice(input) {
        const aggressiveness = input.aggressiveness || 'MODERATE';
        const targetLufs = input.targetLufs ?? -14;
        const deEsser = input.deEsser ?? true;
        const deReverb = input.deReverb ?? true;
        let noiseFilter = 'afftdn=nf=-25:tn=1';
        let reductionDb = 18;
        let clarityBoost = 35;
        if (aggressiveness === 'LIGHT') {
            noiseFilter = 'afftdn=nf=-18:tn=0';
            reductionDb = 12;
            clarityBoost = 20;
        }
        else if (aggressiveness === 'AGGRESSIVE') {
            noiseFilter = 'afftdn=nf=-34:tn=1:bn=1';
            reductionDb = 26;
            clarityBoost = 48;
        }
        const filterList = [
            noiseFilter,
            'highpass=f=80,lowpass=f=12500',
            'acompressor=threshold=-20dB:ratio=3.5:attack=5:release=50:makeup=2',
        ];
        if (deReverb) {
            filterList.push('arnndn=m=std.rnnn');
        }
        if (deEsser) {
            filterList.push('deesser=i=0.8:m=0.5:f=8000:s=o');
        }
        filterList.push(`loudnorm=I=${targetLufs}:LRA=7:tp=-1`);
        const filterComplex = filterList.join(',');
        return {
            isolationId: `iso_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
            appliedFilters: filterList,
            ffmpegAudioFilterComplex: filterComplex,
            targetLufs,
            noiseFloorReductionDb: reductionDb,
            speechClarityBoostPercent: clarityBoost,
            simulatedOutputAudioUrl: '/renders/audio/enhanced_master.wav',
        };
    }
}
exports.VoiceIsolationService = VoiceIsolationService;
exports.voiceIsolationService = new VoiceIsolationService();
//# sourceMappingURL=voice-isolation.service.js.map