/**
 * Cinematic LUT & Auto Color Grading Enhancer (DaVinci / Premiere style)
 * ─────────────────────────────────────────────────────────────────────────────
 * Applies filmic color grading profiles, contrast enhancement, dynamic range expansion,
 * and saturation balancing using standard FFmpeg color balance & curves matrices.
 */

export type ColorPreset = "TEAL_AND_ORANGE" | "MOODY_CINEMATIC" | "COMMERCIAL_VIBRANT" | "CLEAN_MINIMAL";

export interface ColorGradingConfig {
  preset: ColorPreset;
  intensity: number; // 0.1 to 1.0 (default 0.8)
  exposureBoost?: number; // e.g. 0.05
}

export interface ColorGradingResult {
  preset: ColorPreset;
  ffmpegEqFilter: string;
  description: string;
}

export class ColorGradingService {
  /**
   * Generates FFmpeg eq & colorbalance filter string for cinematic look.
   */
  public generateColorFilter(config: ColorGradingConfig): ColorGradingResult {
    let eqFilter = "";
    let desc = "";

    switch (config.preset) {
      case "TEAL_AND_ORANGE":
        eqFilter = "eq=contrast=1.15:brightness=0.02:saturation=1.25,colorbalance=rs=0.10:gs=-0.02:bs=-0.08:rm=-0.05:gm=0.02:bm=0.12:rh=0.08:gh=0.02:bh=-0.05";
        desc = "Estilo Hollywood Teal & Orange: tonos de piel cálidos con sombras turquesas/cian.";
        break;

      case "MOODY_CINEMATIC":
        eqFilter = "eq=contrast=1.28:brightness=-0.04:saturation=0.90,colorbalance=rs=-0.05:gs=0.00:bs=0.08:rm=-0.08:gm=-0.02:bm=0.05";
        desc = "Estilo Cinematográfico Oscuro: sombras profundas y contraste dramático.";
        break;

      case "COMMERCIAL_VIBRANT":
        eqFilter = "eq=contrast=1.10:brightness=0.04:saturation=1.35,colorbalance=rs=0.04:gs=0.04:bs=0.04";
        desc = "Estilo Comercial Vibrante: colores intensos y alta luminosidad para anuncios publicitarios.";
        break;

      case "CLEAN_MINIMAL":
      default:
        eqFilter = "eq=contrast=1.05:brightness=0.01:saturation=1.05";
        desc = "Estilo Limpio y Natural: corrección suave de contraste y balance de blancos neutro.";
        break;
    }

    return {
      preset: config.preset,
      ffmpegEqFilter: eqFilter,
      description: desc,
    };
  }
}

export const colorGradingService = new ColorGradingService();
