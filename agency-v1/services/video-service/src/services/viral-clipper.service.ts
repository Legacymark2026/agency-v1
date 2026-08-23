/**
 * AI Viral Highlight & Retention Hook Clipper (OpusClip / Klap style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Analyzes video transcript, audio energy levels, and narrative hook triggers
 * to automatically extract 15s, 30s, and 60s viral short-form clips with virality scores.
 */

export interface TranscriptSentence {
  text: string;
  startSec: number;
  endSec: number;
  energyLevel: number; // 0.0 to 1.0
}

export interface ViralClipResult {
  clipId: string;
  title: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  viralityScore: number; // 0 to 100
  hookHeadline: string;
  recommendedPlatform: "TIKTOK" | "INSTAGRAM_REELS" | "YOUTUBE_SHORTS";
}

export class ViralClipperService {
  private hookKeywords = ["secreto", "descubre", "error", "millones", "estrategia", "increíble", "dinero", "éxito", "cuidado"];

  /**
   * Extracts viral highlight clips from a full video transcript and energy profile.
   */
  public extractViralClips(
    sentences: TranscriptSentence[],
    targetDuration: 15 | 30 | 60 = 30
  ): ViralClipResult[] {
    const clips: ViralClipResult[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const startSentence = sentences[i];
      let currentDuration = 0;
      let textAccum = "";
      let totalEnergy = 0;
      let sentenceCount = 0;
      let j = i;

      while (j < sentences.length && currentDuration < targetDuration) {
        const s = sentences[j];
        textAccum += ` ${s.text}`;
        totalEnergy += s.energyLevel;
        sentenceCount++;
        currentDuration = s.endSec - startSentence.startSec;
        j++;
      }

      if (currentDuration >= targetDuration * 0.7) {
        const avgEnergy = totalEnergy / sentenceCount;
        const hasHookKeyword = this.hookKeywords.some((kw) => textAccum.toLowerCase().includes(kw));

        let score = Math.round(avgEnergy * 60 + (hasHookKeyword ? 35 : 15));
        if (score > 98) score = 98;

        const endSec = sentences[j - 1]?.endSec || startSentence.startSec + currentDuration;

        clips.push({
          clipId: `clip_${Math.random().toString(36).substring(2, 9)}`,
          title: startSentence.text.substring(0, 45) + "...",
          startSec: startSentence.startSec,
          endSec: Math.round(endSec * 100) / 100,
          durationSec: Math.round((endSec - startSentence.startSec) * 100) / 100,
          viralityScore: score,
          hookHeadline: hasHookKeyword ? "🔥 Gancho de Alta Retención Detectado" : "💡 Momento Clave",
          recommendedPlatform: targetDuration <= 30 ? "TIKTOK" : "YOUTUBE_SHORTS",
        });

        i = j - 1; // Advance window
      }
    }

    return clips.sort((a, b) => b.viralityScore - a.viralityScore);
  }
}

export const viralClipperService = new ViralClipperService();
