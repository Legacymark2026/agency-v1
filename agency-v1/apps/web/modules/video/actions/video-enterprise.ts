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

  // Local fallback execution if container is warming up
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
  const assScript = service.exportToAssScript(blocks);
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
  voiceEvents: { startSec: number; endSec: number }[];
  totalDurationSec: number;
  duckingDepthDb?: number;
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
  const result = service.calculateDuckingCurve(params.voiceEvents, params.totalDurationSec, params.duckingDepthDb || -18);
  return { success: true, result };
}

// 5. Smart Reframe
export async function runSmartReframeAction(params: {
  faceTrackingPoints: { timestampSec: number; normalizedX: number; normalizedY: number; confidence: number }[];
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
  const result = service.calculateCropPath(params.faceTrackingPoints, params.sourceWidth || 1920, params.sourceHeight || 1080);
  return { success: true, result };
}

// 6. Match B-Roll
export async function runBrollMatchingAction(params: {
  transcript: { keyword: string; timestampSec: number }[];
}) {
  try {
    const mediaAssets = await prisma.mediaAsset.findMany({ take: 20 });
    const availableAssets = mediaAssets.map(a => ({
      assetId: a.id,
      title: a.title || "Clip de Archivo",
      tags: [(a.category || "").toLowerCase(), (a.type || "").toLowerCase()],
      durationSec: 5,
    }));

    const { BrollMatcherService } = await import("../../../../../services/video-service/src/services/broll-matcher.service");
    const service = new BrollMatcherService();
    const matched = service.matchBrolls(params.transcript, availableAssets);
    return { success: true, matched };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. Generate Thumbnail
export async function runGenerateThumbnailAction(params: {
  videoTitle: string;
  candidateFrames?: { timestampSec: number; faceClarityScore: number; sharpnessScore: number; expressionType: "SMILING" | "EXCITED" | "SERIOUS" | "THINKING" }[];
  targetFormat?: "1280x720" | "1080x1920";
}) {
  try {
    const { ThumbnailGeneratorService } = await import("../../../../../services/video-service/src/services/thumbnail-generator.service");
    const service = new ThumbnailGeneratorService();
    const design = service.generateThumbnailDesign(
      params.videoTitle,
      params.candidateFrames || [
        { timestampSec: 4.2, faceClarityScore: 0.95, sharpnessScore: 0.92, expressionType: "EXCITED" },
        { timestampSec: 12.8, faceClarityScore: 0.88, sharpnessScore: 0.85, expressionType: "SMILING" },
      ],
      params.targetFormat || "1280x720"
    );
    return { success: true, design };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
