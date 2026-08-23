/**
 * Automatic Voiceover Audio Ducking & Sidechain Compression Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically attenuates background music when voiceover is detected
 * and restores background audio during speech pauses with smooth volume envelopes.
 */

export interface SpeechSegment {
  startSec: number;
  endSec: number;
}

export interface VolumePoint {
  timeSec: number;
  volumeMultiplier: number; // 0.0 to 1.0 (e.g. 0.15 = -16.5 dB, 0.8 = -1.9 dB)
}

export interface AudioDuckingCurveResult {
  duckedVolumeMultiplier: number;
  normalVolumeMultiplier: number;
  attackMs: number;
  releaseMs: number;
  volumePoints: VolumePoint[];
  ffmpegAFilter: string;
}

export class AudioDuckingService {
  /**
   * Generates dynamic audio volume envelope points and FFmpeg aevalsrc/volume filter.
   */
  public generateDuckingCurve(
    speechSegments: SpeechSegment[],
    totalDurationSec: number,
    duckedLevel = 0.15, // -16.5 dB
    normalLevel = 0.80, // -1.9 dB
    attackMs = 300,
    releaseMs = 500
  ): AudioDuckingCurveResult {
    const volumePoints: VolumePoint[] = [];
    const attackSec = attackMs / 1000;
    const releaseSec = releaseMs / 1000;

    let currentSec = 0;

    for (const seg of speechSegments) {
      if (seg.startSec > currentSec) {
        // Normal music before speech
        volumePoints.push({ timeSec: currentSec, volumeMultiplier: normalLevel });
        volumePoints.push({ timeSec: Math.max(0, seg.startSec - attackSec), volumeMultiplier: normalLevel });
      }

      // Ducked during speech
      volumePoints.push({ timeSec: seg.startSec, volumeMultiplier: duckedLevel });
      volumePoints.push({ timeSec: seg.endSec, volumeMultiplier: duckedLevel });

      // Release back to normal after speech
      volumePoints.push({ timeSec: Math.min(totalDurationSec, seg.endSec + releaseSec), volumeMultiplier: normalLevel });
      currentSec = seg.endSec + releaseSec;
    }

    if (currentSec < totalDurationSec) {
      volumePoints.push({ timeSec: totalDurationSec, volumeMultiplier: normalLevel });
    }

    const ffmpegAFilter = `[1:a]volume='if(between(t,${speechSegments.map((s) => `${s.startSec},${s.endSec}`).join("+")}),${duckedLevel},${normalLevel})':eval=frame[bg_music];[0:a][bg_music]amix=inputs=2:duration=first[aout]`;

    return {
      duckedVolumeMultiplier: duckedLevel,
      normalVolumeMultiplier: normalLevel,
      attackMs,
      releaseMs,
      volumePoints,
      ffmpegAFilter,
    };
  }
}

export const audioDuckingService = new AudioDuckingService();
