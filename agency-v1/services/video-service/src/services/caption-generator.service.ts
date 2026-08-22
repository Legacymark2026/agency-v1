/**
 * Video Caption & Multi-Platform Aspect Ratio Cropper
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates SRT/VTT subtitles and calculates smart 9:16 crop boundaries
 * for TikTok, Instagram Reels, and YouTube Shorts.
 */

export interface CaptionSegment {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface VideoFormatCropResult {
  targetAspect: "9:16" | "1:1" | "16:9";
  cropWidth: number;
  cropHeight: number;
  cropX: number;
  cropY: number;
  vttContent: string;
  srtContent: string;
}

export function generateVideoCaptionsAndCrop(
  scriptText: string,
  originalWidth = 1920,
  originalHeight = 1080,
  targetAspect: "9:16" | "1:1" | "16:9" = "9:16"
): VideoFormatCropResult {
  const words = scriptText.split(/\s+/).filter(Boolean);
  const wordsPerSegment = 6;
  const segments: CaptionSegment[] = [];

  let wordIndex = 0;
  let segIndex = 1;
  const durationPerWordSeconds = 0.4;

  while (wordIndex < words.length) {
    const chunk = words.slice(wordIndex, wordIndex + wordsPerSegment).join(" ");
    const startSec = Math.round(wordIndex * durationPerWordSeconds);
    const endSec = Math.round((wordIndex + wordsPerSegment) * durationPerWordSeconds);

    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60).toString().padStart(2, "0");
      const s = (sec % 60).toString().padStart(2, "0");
      return `00:${m}:${s}.000`;
    };

    segments.push({
      index: segIndex++,
      startTime: formatTime(startSec),
      endTime: formatTime(endSec),
      text: chunk,
    });

    wordIndex += wordsPerSegment;
  }

  const vttContent = `WEBVTT\n\n` + segments.map((s) => `${s.startTime} --> ${s.endTime}\n${s.text}\n`).join("\n");
  const srtContent = segments.map((s) => `${s.index}\n${s.startTime.replace(".", ",")} --> ${s.endTime.replace(".", ",")}\n${s.text}\n`).join("\n");

  // Calculate 9:16 Crop Box
  let cropWidth = originalWidth;
  let cropHeight = originalHeight;
  let cropX = 0;
  let cropY = 0;

  if (targetAspect === "9:16") {
    cropWidth = Math.round(originalHeight * (9 / 16));
    cropHeight = originalHeight;
    cropX = Math.round((originalWidth - cropWidth) / 2);
    cropY = 0;
  } else if (targetAspect === "1:1") {
    cropWidth = originalHeight;
    cropHeight = originalHeight;
    cropX = Math.round((originalWidth - cropWidth) / 2);
    cropY = 0;
  }

  return {
    targetAspect,
    cropWidth,
    cropHeight,
    cropX,
    cropY,
    vttContent,
    srtContent,
  };
}
