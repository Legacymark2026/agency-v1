"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHistogram = extractHistogram;
exports.suggestColorMatch = suggestColorMatch;
exports.generateColorMatchFFmpegFilter = generateColorMatchFFmpegFilter;
exports.batchColorMatch = batchColorMatch;
exports.createLUT3D = createLUT3D;
exports.getDefaultLUTs = getDefaultLUTs;
const child_process_1 = require("child_process");
const DEFAULT_OPTIONS = {
    tolerance: 0.1,
    preserveSkinTones: true,
    matchLuminance: true,
    matchSaturation: true,
    matchTemperature: true,
};
function generateMatchId() {
    return `cm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function extractHistogram(imagePath, bins = 256) {
    try {
        const result = (0, child_process_1.execSync)(`ffmpeg -i "${imagePath}" -vf "split=2[rgb][lum];[rgb]format=rgb24,histogram=level_height=200:scale_mode=log,format=rgb24[hist];[lum]format=gray,histogram=level_height=200:scale_mode=log[gray]" -f null - 2>&1`, { timeout: 30000 });
        const output = result.toString();
        const r = new Array(bins).fill(0);
        const g = new Array(bins).fill(0);
        const b = new Array(bins).fill(0);
        const valueMatch = output.matchAll(/hist_(\d+):\s*(\d+)\s+(\d+)\s+(\d+)/g);
        for (const match of valueMatch) {
            const idx = parseInt(match[1]);
            if (idx < bins) {
                r[idx] = parseInt(match[2]);
                g[idx] = parseInt(match[3]);
                b[idx] = parseInt(match[4]);
            }
        }
        const luminance = r.map((_, i) => Math.round(r[i] * 0.299 + g[i] * 0.587 + b[i] * 0.114));
        const avgR = Math.round(r.reduce((a, v, i) => a + v * i, 0) / Math.max(1, r.reduce((a, v) => a + v, 0)));
        const avgG = Math.round(g.reduce((a, v, i) => a + v * i, 0) / Math.max(1, g.reduce((a, v) => a + v, 0)));
        const avgB = Math.round(b.reduce((a, v, i) => a + v * i, 0) / Math.max(1, b.reduce((a, v) => a + v, 0)));
        const maxR = r.indexOf(Math.max(...r));
        const maxG = g.indexOf(Math.max(...g));
        const maxB = b.indexOf(Math.max(...b));
        const dominantColors = [
            `#${maxR.toString(16).padStart(2, '0')}${maxG.toString(16).padStart(2, '0')}${maxB.toString(16).padStart(2, '0')}`,
            `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`,
        ];
        return {
            r,
            g,
            b,
            luminance,
            dominantColors: [...new Set(dominantColors)],
            averageRGB: [avgR, avgG, avgB],
            averageHSL: rgbToHsl(avgR, avgG, avgB),
        };
    }
    catch {
        const avg = 128;
        const flat = new Array(bins).fill(1);
        return {
            r: flat,
            g: flat,
            b: flat,
            luminance: flat,
            dominantColors: ['#808080'],
            averageRGB: [avg, avg, avg],
            averageHSL: [0, 0, 0.5],
        };
    }
}
function rgbToHsl(r, g, b) {
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;
    const max = Math.max(rs, gs, bs);
    const min = Math.min(rs, gs, bs);
    const l = (max + min) / 2;
    if (max === min)
        return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
        case rs:
            h = ((gs - bs) / d + (gs < bs ? 6 : 0)) / 6;
            break;
        case gs:
            h = ((bs - rs) / d + 2) / 6;
            break;
        case bs:
            h = ((rs - gs) / d + 4) / 6;
            break;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToRgb(h, s, l) {
    const hs = h / 360;
    const ss = s / 100;
    const ls = l / 100;
    if (ss === 0) {
        const v = Math.round(ls * 255);
        return [v, v, v];
    }
    const hue2rgb = (p, q, t) => {
        if (t < 0)
            t += 1;
        if (t > 1)
            t -= 1;
        if (t < 1 / 6)
            return p + (q - p) * 6 * t;
        if (t < 1 / 2)
            return q;
        if (t < 2 / 3)
            return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = ls < 0.5 ? ls * (1 + ss) : ls + ss - ls * ss;
    const p = 2 * ls - q;
    const r = hue2rgb(p, q, hs + 1 / 3);
    const g = hue2rgb(p, q, hs);
    const b = hue2rgb(p, q, hs - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function suggestColorMatch(sourceImg, targetImg, sourceId, targetId, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sourceHist = extractHistogram(sourceImg);
    const targetHist = extractHistogram(targetImg);
    const adjustments = {};
    const reasons = [];
    if (opts.matchLuminance) {
        const sourceLum = sourceHist.averageHSL[2];
        const targetLum = targetHist.averageHSL[2];
        const lumDiff = sourceLum - targetLum;
        const exposureDelta = Math.round(lumDiff / 10);
        if (Math.abs(exposureDelta) > 2) {
            adjustments.exposure = exposureDelta;
            adjustments.brightness = Math.round(lumDiff * 0.5);
            adjustments.gamma = Math.round((sourceLum / Math.max(1, targetLum)) * 100) / 100;
            reasons.push(`Ajuste de luminosidad: ${lumDiff > 0 ? 'subexponer' : 'sobreexponer'} ${Math.abs(exposureDelta)} pasos`);
        }
    }
    if (opts.matchSaturation) {
        const sourceSat = sourceHist.averageHSL[1];
        const targetSat = targetHist.averageHSL[1];
        const satDiff = sourceSat - targetSat;
        if (Math.abs(satDiff) > 5) {
            adjustments.saturation = Math.round(satDiff * 0.8);
            adjustments.vibrance = Math.round(satDiff * 0.5);
            reasons.push(`Ajuste de saturación: ${satDiff > 0 ? 'aumentar' : 'reducir'} ${Math.abs(Math.round(satDiff * 0.8))}%`);
        }
    }
    if (opts.matchTemperature) {
        const sourceHue = sourceHist.averageHSL[0];
        const targetHue = targetHist.averageHSL[0];
        const hueDiff = sourceHue - targetHue;
        if (Math.abs(hueDiff) > 5) {
            adjustments.temperature = Math.round(hueDiff * 0.3);
            adjustments.tint = Math.round(hueDiff * 0.1);
            reasons.push(`Ajuste de temperatura: ${hueDiff > 0 ? 'enfriar' : 'calentar'} ${Math.abs(Math.round(hueDiff * 0.3))} unidades`);
        }
    }
    const contrastSource = computeContrast(sourceHist);
    const contrastTarget = computeContrast(targetHist);
    const contrastDiff = contrastSource - contrastTarget;
    if (Math.abs(contrastDiff) > 5) {
        adjustments.contrast = Math.round(contrastDiff * 0.5);
        reasons.push(`Ajuste de contraste: ${contrastDiff > 0 ? 'aumentar' : 'reducir'} ${Math.abs(Math.round(contrastDiff * 0.5))}%`);
    }
    const rgbDiff = Math.abs(sourceHist.averageRGB[0] - targetHist.averageRGB[0]) +
        Math.abs(sourceHist.averageRGB[1] - targetHist.averageRGB[1]) +
        Math.abs(sourceHist.averageRGB[2] - targetHist.averageRGB[2]);
    const confidence = Math.max(30, Math.min(98, Math.round(100 - rgbDiff / 10)));
    return {
        id: generateMatchId(),
        sourceClip: sourceId,
        targetClip: targetId,
        adjustments,
        confidence,
        reason: reasons.join('; ') || 'Ajustes mínimos necesarios',
    };
}
function computeContrast(hist) {
    const luminances = hist.luminance;
    const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
    const variance = luminances.reduce((a, b) => a + (b - mean) ** 2, 0) / luminances.length;
    return Math.sqrt(variance);
}
function generateColorMatchFFmpegFilter(adjustments) {
    const filters = [];
    if (adjustments.brightness !== undefined && adjustments.brightness !== 0) {
        filters.push(`eq=brightness=${(adjustments.brightness / 100).toFixed(3)}`);
    }
    if (adjustments.contrast !== undefined && adjustments.contrast !== 0) {
        filters.push(`eq=contrast=${(1 + adjustments.contrast / 100).toFixed(3)}`);
    }
    if (adjustments.saturation !== undefined && adjustments.saturation !== 0) {
        filters.push(`eq=saturation=${(1 + adjustments.saturation / 100).toFixed(3)}`);
    }
    if (adjustments.temperature !== undefined && adjustments.temperature !== 0) {
        const tempVal = adjustments.temperature / 100;
        filters.push(`colorbalance=rs=${tempVal.toFixed(3)}:gs=${(-tempVal * 0.5).toFixed(3)}:bs=${(-tempVal * 0.3).toFixed(3)}`);
    }
    if (adjustments.exposure !== undefined && adjustments.exposure !== 0) {
        filters.push(`exposure=${(adjustments.exposure / 10).toFixed(3)}`);
    }
    if (adjustments.gamma !== undefined && adjustments.gamma !== 0) {
        filters.push(`eq=gamma=${adjustments.gamma.toFixed(3)}`);
    }
    if (adjustments.highlights !== undefined && adjustments.highlights !== 0) {
        filters.push(`colorbalance=rh=${(adjustments.highlights / 200).toFixed(3)}:gh=${(adjustments.highlights / 200).toFixed(3)}:bh=${(adjustments.highlights / 200).toFixed(3)}`);
    }
    if (adjustments.shadows !== undefined && adjustments.shadows !== 0) {
        filters.push(`colorbalance=rs=${(adjustments.shadows / 200).toFixed(3)}:gs=${(adjustments.shadows / 200).toFixed(3)}:bs=${(adjustments.shadows / 200).toFixed(3)}`);
    }
    return filters.join(',');
}
function batchColorMatch(clips, referenceId, options) {
    const reference = clips.find((c) => c.id === referenceId);
    if (!reference)
        return [];
    const suggestions = [];
    for (const clip of clips) {
        if (clip.id === referenceId)
            continue;
        const suggestion = suggestColorMatch(reference.path, clip.path, reference.id, clip.id, options);
        suggestions.push(suggestion);
    }
    return suggestions.sort((a, b) => b.confidence - a.confidence);
}
function createLUT3D(adjustments, size = 33) {
    const data = [];
    for (let b = 0; b < size; b++) {
        data[b] = [];
        for (let g = 0; g < size; g++) {
            data[b][g] = [];
            for (let r = 0; r < size; r++) {
                let rr = r / (size - 1);
                let gg = g / (size - 1);
                let bb = b / (size - 1);
                if (adjustments.brightness) {
                    rr = Math.max(0, Math.min(1, rr + adjustments.brightness / 200));
                    gg = Math.max(0, Math.min(1, gg + adjustments.brightness / 200));
                    bb = Math.max(0, Math.min(1, bb + adjustments.brightness / 200));
                }
                if (adjustments.contrast) {
                    const cf = (100 + adjustments.contrast) / 100;
                    rr = Math.max(0, Math.min(1, (rr - 0.5) * cf + 0.5));
                    gg = Math.max(0, Math.min(1, (gg - 0.5) * cf + 0.5));
                    bb = Math.max(0, Math.min(1, (bb - 0.5) * cf + 0.5));
                }
                if (adjustments.saturation) {
                    const gray = rr * 0.299 + gg * 0.587 + bb * 0.114;
                    const sf = (100 + adjustments.saturation) / 100;
                    rr = Math.max(0, Math.min(1, gray + (rr - gray) * sf));
                    gg = Math.max(0, Math.min(1, gray + (gg - gray) * sf));
                    bb = Math.max(0, Math.min(1, gray + (bb - gray) * sf));
                }
                data[b][g][r] = rr;
                data[b][g][r + 1] = gg;
                data[b][g][r + 2] = bb;
            }
        }
    }
    return {
        name: `color_match_${Date.now()}`,
        data,
        description: 'Color matching LUT generated from histogram analysis',
    };
}
function getDefaultLUTs() {
    return [
        {
            name: 'Cinematic Teal & Orange',
            data: [],
            description: 'Look cinematográfico con pieles naranjas y sombras azul-verdosas',
        },
        {
            name: 'Film Noir',
            data: [],
            description: 'Alto contraste, baja saturación, sombras profundas',
        },
        {
            name: 'Vintage Warm',
            data: [],
            description: 'Tonos cálidos vintage con realce de dorados',
        },
        {
            name: 'Modern Clean',
            data: [],
            description: 'Look limpio y moderno con saturación natural',
        },
    ];
}
//# sourceMappingURL=index.js.map