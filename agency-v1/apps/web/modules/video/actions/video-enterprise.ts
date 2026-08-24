"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VIDEO_SERVICE_URL = process.env.VIDEO_SERVICE_URL || "http://video-service:4007";

// 1. Auto-Clip Viral
export async function runAutoClipAction(params: {
  sentences: { text: string; startSec: number; endSec: number; energyLevel: number }[];
  targetDuration?: 15 | 30 | 60;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/auto-clip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, clips: data.clips };
    }
  } catch (_) {}

  const { ViralClipperService } = await import("../../../../../services/video-service/src/services/viral-clipper.service");
  const clipper = new ViralClipperService();
  const clips = clipper.extractViralClips(params.sentences, params.targetDuration || 30);
  return { success: true, clips };
}

// 2. Subtítulos Cinéticos
export async function runKineticSubtitlesAction(params: {
  words: { word: string; startSec: number; endSec: number }[];
  wordsPerBlock?: number;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/kinetic-subtitles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, blocks: data.blocks, assScript: data.assScript };
    }
  } catch (_) {}

  const { KineticSubtitlesService } = await import("../../../../../services/video-service/src/services/kinetic-subtitles.service");
  const service = new KineticSubtitlesService();
  const blocks = service.generateSubtitleBlocks(params.words, params.wordsPerBlock || 4);
  const assScript = service.generateASSFormat(blocks);
  return { success: true, blocks, assScript };
}

// 3. Eliminador de Silencios
export async function runSilenceRemovalAction(params: {
  samples: { timestampSec: number; dbLevel: number }[];
  thresholdDb?: number;
  minSilenceDurationSec?: number;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/remove-silence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, result: data.result };
    }
  } catch (_) {}

  const { SilenceRemoverService } = await import("../../../../../services/video-service/src/services/silence-remover.service");
  const service = new SilenceRemoverService();
  const result = service.removeSilence(params.samples, params.thresholdDb || -35, params.minSilenceDurationSec || 0.5);
  return { success: true, result };
}

// 4. Auto-Ducking
export async function runAudioDuckingAction(params: {
  speechSegments: { startSec: number; endSec: number }[];
  totalDurationSec: number;
  duckedLevel?: number;
  normalLevel?: number;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/auto-duck`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, result: data.result };
    }
  } catch (_) {}

  const { AudioDuckingService } = await import("../../../../../services/video-service/src/services/audio-ducking.service");
  const service = new AudioDuckingService();
  const result = service.generateDuckingCurve(
    params.speechSegments,
    params.totalDurationSec,
    params.duckedLevel || 0.15,
    params.normalLevel || 0.8
  );
  return { success: true, result };
}

// 5. Smart Reframe
export async function runSmartReframeAction(params: {
  targetRatio?: "9:16" | "1:1" | "4:5" | "16:9";
  fitMode?: "SMART_CENTER_CROP" | "BLURRED_BACKDROP_LETTERBOX";
  sourceWidth?: number;
  sourceHeight?: number;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/smart-reframe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, result: data.result };
    }
  } catch (_) {}

  const { SmartReframeService } = await import("../../../../../services/video-service/src/services/smart-reframe.service");
  const service = new SmartReframeService();
  const result = service.computeReframeFilter({
    targetRatio: params.targetRatio || "9:16",
    fitMode: params.fitMode || "SMART_CENTER_CROP",
    sourceWidth: params.sourceWidth || 1920,
    sourceHeight: params.sourceHeight || 1080,
  });
  return { success: true, result };
}

// 6. Match B-Roll
export async function runBrollMatchingAction(params: {
  transcriptSegments: { text: string; startSec: number; endSec: number }[];
  minGapBetweenBrollsSec?: number;
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/match-broll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, matched: data.matched };
    }
  } catch (_) {}

  const { BrollMatcherService } = await import("../../../../../services/video-service/src/services/broll-matcher.service");
  const service = new BrollMatcherService();
  const matched = service.matchBrollToTranscript(params.transcriptSegments, params.minGapBetweenBrollsSec || 4);
  return { success: true, matched };
}

// 7. Generate Thumbnail
export async function runGenerateThumbnailAction(params: {
  videoTitle: string;
  candidates?: { timestampSec: number; faceClarityScore: number; sharpnessScore: number; expressionType: "SMILING" | "EXCITED" | "SERIOUS" | "THINKING" }[];
  targetFormat?: "1280x720" | "1080x1920";
}) {
  try {
    const res = await fetch(`${VIDEO_SERVICE_URL}/api/v1/video/generate-thumbnail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, design: data.design };
    }
  } catch (_) {}

  const { ThumbnailGeneratorService } = await import("../../../../../services/video-service/src/services/thumbnail-generator.service");
  const service = new ThumbnailGeneratorService();
  const design = service.generateThumbnailDesign(
    params.videoTitle,
    params.candidates || [
      { timestampSec: 4.2, faceClarityScore: 0.95, sharpnessScore: 0.92, expressionType: "EXCITED" },
      { timestampSec: 12.8, faceClarityScore: 0.88, sharpnessScore: 0.85, expressionType: "SMILING" },
    ],
    params.targetFormat || "1280x720"
  );
  return { success: true, design };
}
