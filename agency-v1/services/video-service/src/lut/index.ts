import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export interface LUTConfig {
  lutPath: string;
  intensity: number;
  format: 'cube' | '3dl' | 'look';
}

export interface ColorGradePreset {
  name: string;
  description: string;
  lutFile: string;
  intensity: number;
  category: 'cinematic' | 'documentary' | 'vintage' | 'modern' | 'dramatic';
}

export const LUT_PRESETS: ColorGradePreset[] = [
  {
    name: 'Cinematic Teal & Orange',
    description: 'Look cinematográfico clásico con sombras teal y highlights naranja',
    lutFile: 'cinematic_teal_orange.cube',
    intensity: 0.8,
    category: 'cinematic',
  },
  {
    name: 'Film Noir',
    description: 'Alto contraste, blanco y negro dramático',
    lutFile: 'film_noir.cube',
    intensity: 1.0,
    category: 'dramatic',
  },
  {
    name: 'Vintage Warm',
    description: 'Tonos cálidos con degradado de película antigua',
    lutFile: 'vintage_warm.cube',
    intensity: 0.7,
    category: 'vintage',
  },
  {
    name: 'Modern Clean',
    description: 'Colores limpios y naturales, ideal para contenido corporativo',
    lutFile: 'modern_clean.cube',
    intensity: 0.5,
    category: 'modern',
  },
  {
    name: 'Documentary Natural',
    description: 'Look natural y documental, colores fieles a la realidad',
    lutFile: 'documentary_natural.cube',
    intensity: 0.6,
    category: 'documentary',
  },
  {
    name: 'Luxury Gold',
    description: 'Tonos dorados y elegantes para contenido premium',
    lutFile: 'luxury_gold.cube',
    intensity: 0.75,
    category: 'cinematic',
  },
  {
    name: 'Moody Dark',
    description: 'Sombras profundas, atmósfera oscura y misteriosa',
    lutFile: 'moody_dark.cube',
    intensity: 0.85,
    category: 'dramatic',
  },
  {
    name: 'Bright & Airy',
    description: 'Luminoso y etéreo, ideal para lifestyle y moda',
    lutFile: 'bright_airy.cube',
    intensity: 0.65,
    category: 'modern',
  },
];

export async function applyLUT(
  inputPath: string,
  outputPath: string,
  lutConfig: LUTConfig,
): Promise<boolean> {
  if (!existsSync(lutConfig.lutPath)) {
    console.warn(`[LUT] LUT file not found: ${lutConfig.lutPath}`);
    return false;
  }

  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    console.warn('[LUT] FFmpeg not available');
    return false;
  }

  try {
    const cmd = [
      'ffmpeg -y',
      `-i "${inputPath}"`,
      `-vf "lut3d=file='${lutConfig.lutPath}':interp=tetrahedral"`,
      `-c:v libx264 -preset fast -crf 23`,
      `-c:a copy`,
      `"${outputPath}"`,
    ].join(' ');

    await execAsync(cmd, { timeout: 300000 });
    return true;
  } catch (error) {
    console.error('[LUT] Error applying LUT:', error);
    return false;
  }
}

export async function applyColorGrade(
  inputPath: string,
  outputPath: string,
  presetName: string,
  intensity?: number,
): Promise<boolean> {
  const preset = LUT_PRESETS.find(p => p.name === presetName);
  if (!preset) {
    console.warn(`[LUT] Preset not found: ${presetName}`);
    return false;
  }

  const lutConfig: LUTConfig = {
    lutPath: preset.lutFile,
    intensity: intensity ?? preset.intensity,
    format: 'cube',
  };

  return applyLUT(inputPath, outputPath, lutConfig);
}

export function getLUTPresets(): ColorGradePreset[] {
  return LUT_PRESETS;
}

export function getLUTPresetsByCategory(category: string): ColorGradePreset[] {
  return LUT_PRESETS.filter(p => p.category === category);
}

async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
