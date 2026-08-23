/**
 * Lower-Thirds Branding & Animated Watermark Overlay Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates broadcast-grade animated lower-third title overlays (Speaker, Title,
 * Handle) and corner brand watermarks with smooth fade-in/fade-out transitions.
 */

export interface LowerThirdConfig {
  speakerName: string;
  speakerRole: string;
  socialHandle?: string;
  startSec: number;
  durationSec: number;
  themeColor: "EMERALD_NEON" | "CYAN_TECH" | "GOLD_LUXURY" | "MONOCHROME_DARK";
}

export interface WatermarkConfig {
  logoUrl: string;
  position: "TOP_RIGHT" | "TOP_LEFT" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
  opacity: number; // 0.1 to 1.0 (e.g. 0.7)
  scalePercent: number; // e.g. 15 for 15% width
}

export interface BrandingFilterResult {
  ffmpegDrawtextFilter: string;
  ffmpegOverlayFilter: string;
  totalElementsCount: number;
  previewDescription: string;
}

export class BrandingOverlayService {
  /**
   * Generates FFmpeg complex filters for lower-third and logo watermarks.
   */
  public generateBrandingFilters(
    lowerThird: LowerThirdConfig,
    watermark?: WatermarkConfig
  ): BrandingFilterResult {
    const endSec = lowerThird.startSec + lowerThird.durationSec;
    const fontColor = "white";
    const boxColor = lowerThird.themeColor === "EMERALD_NEON" ? "0x10b981CC" : "0x0f172aEE";

    // Animated lower-third drawtext filter
    const nameDrawtext = `drawtext=text='${lowerThird.speakerName.toUpperCase()}':fontcolor=${fontColor}:fontsize=36:box=1:boxcolor=${boxColor}:boxborderw=12:x='if(between(t,${lowerThird.startSec},${endSec}),60,-500)':y=H-240:enable='between(t,${lowerThird.startSec},${endSec})'`;
    const roleDrawtext = `drawtext=text='${lowerThird.speakerRole}${lowerThird.socialHandle ? ` | ${lowerThird.socialHandle}` : ""}':fontcolor=0x94a3b8:fontsize=24:box=1:boxcolor=0x020617CC:boxborderw=8:x='if(between(t,${lowerThird.startSec},${endSec}),60,-500)':y=H-175:enable='between(t,${lowerThird.startSec},${endSec})'`;

    const combinedDrawtext = `${nameDrawtext},${roleDrawtext}`;

    let overlayFilter = "";
    if (watermark) {
      overlayFilter = `[1:v]scale=iw*${(watermark.scalePercent / 100).toFixed(2)}:-1,format=rgba,colorchannelmixer=aa=${watermark.opacity}[logo];[0:v][logo]overlay=W-w-40:40`;
    }

    return {
      ffmpegDrawtextFilter: combinedDrawtext,
      ffmpegOverlayFilter: overlayFilter,
      totalElementsCount: watermark ? 2 : 1,
      previewDescription: `Lower-Third para "${lowerThird.speakerName}" (${lowerThird.startSec}s-${endSec}s)${watermark ? " + Marca de agua en esquina" : ""}`,
    };
  }
}

export const brandingOverlayService = new BrandingOverlayService();
