/**
 * High-CTR AI Thumbnail & Punchy Headline Generator (Canva / Midjourney style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Selects peak visual candidate timestamps (face clarity, sharpness, emotion),
 * and generates high-contrast, clickable headline text overlays with bold borders.
 */

export interface CandidateFrame {
  timestampSec: number;
  faceClarityScore: number; // 0.0 to 1.0
  sharpnessScore: number; // 0.0 to 1.0
  expressionType: "SMILING" | "EXCITED" | "SERIOUS" | "THINKING";
}

export interface ThumbnailDesignOutput {
  chosenTimestampSec: number;
  overallFrameQuality: number; // 0 to 100
  punchyHeadline: string;
  badgeTag: string;
  recommendedResolution: "1280x720" | "1080x1920";
  ffmpegThumbnailCommand: string;
}

export class ThumbnailGeneratorService {
  /**
   * Evaluates candidate frames and designs an eye-catching thumbnail layout.
   */
  public generateThumbnailDesign(
    videoTitle: string,
    candidates: CandidateFrame[],
    targetFormat: "1280x720" | "1080x1920" = "1280x720"
  ): ThumbnailDesignOutput {
    if (candidates.length === 0) {
      candidates = [{ timestampSec: 2.5, faceClarityScore: 0.85, sharpnessScore: 0.90, expressionType: "EXCITED" }];
    }

    // Rank candidates by clarity + sharpness
    const ranked = candidates
      .map((c) => ({
        ...c,
        compositeScore: Math.round((c.faceClarityScore * 0.6 + c.sharpnessScore * 0.4) * 100),
      }))
      .sort((a, b) => b.compositeScore - a.compositeScore);

    const best = ranked[0];

    // Shorten title to 3-5 high-impact words
    const words = videoTitle.split(" ");
    const punchyHeadline = words.slice(0, 4).join(" ").toUpperCase();
    const badgeTag = "🔥 EXCLUSIVO";

    const drawtext = `drawtext=text='${punchyHeadline}':fontcolor=yellow:fontsize=80:borderw=8:bordercolor=black:x=(w-text_w)/2:y=h-200`;
    const ffmpegCmd = `ffmpeg -ss ${best.timestampSec} -i input.mp4 -vframes 1 -vf "${drawtext}" -q:v 2 thumbnail_${targetFormat}.jpg`;

    return {
      chosenTimestampSec: best.timestampSec,
      overallFrameQuality: best.compositeScore,
      punchyHeadline,
      badgeTag,
      recommendedResolution: targetFormat,
      ffmpegThumbnailCommand: ffmpegCmd,
    };
  }
}

export const thumbnailGeneratorService = new ThumbnailGeneratorService();
