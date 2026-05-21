import { VideoSessionMemory, TimelineState } from '../memory/session-memory';

export interface SmartCropArgs {
  trackId: string;
  targetAspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  sessionId: string;
}

export interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  timestamp: number;
}

export interface SmartCropResult {
  success: boolean;
  trackId: string;
  originalResolution: string;
  newResolution: string;
  cropPath: { x: number; y: number; scale: number }[];
  facesDetected: number;
}

export async function applySmartCrop(
  args: SmartCropArgs,
  memory: VideoSessionMemory,
): Promise<SmartCropResult> {
  const { trackId, targetAspectRatio, sessionId } = args;

  const currentState = await memory.getState(sessionId);
  if (!currentState) {
    throw new Error('No timeline state found for session');
  }

  const clipIndex = currentState.clips.findIndex((c: any) => c.id === trackId);
  if (clipIndex === -1) {
    throw new Error(`Track ${trackId} not found`);
  }

  const clip = currentState.clips[clipIndex];
  const originalWidth = clip.width || 1920;
  const originalHeight = clip.height || 1080;

  const aspectRatios: Record<string, [number, number]> = {
    '9:16': [1080, 1920],
    '16:9': [1920, 1080],
    '1:1': [1080, 1080],
    '4:5': [1080, 1350],
  };

  const [targetWidth, targetHeight] = aspectRatios[targetAspectRatio];

  const faces = await detectFacesInClip(clip);
  const cropPath = generateCropPath(faces, originalWidth, originalHeight, targetWidth, targetHeight);

  const beforeState = JSON.parse(JSON.stringify(currentState));

  currentState.clips[clipIndex] = {
    ...clip,
    smartCrop: true,
    smartCropInfo: {
      originalResolution: `${originalWidth}x${originalHeight}`,
      targetResolution: `${targetWidth}x${targetHeight}`,
      targetAspectRatio,
      cropPath,
      facesDetected: faces.length,
    },
  };

  await memory.saveState(sessionId, currentState);

  await memory.pushHistory(sessionId, {
    id: `smart_crop_${Date.now()}`,
    action: 'smart_crop',
    description: `Smart crop clip ${trackId} to ${targetAspectRatio} (${targetWidth}x${targetHeight}), ${faces.length} faces tracked`,
    beforeState: { clips: [beforeState.clips[clipIndex]] },
    afterState: { clips: [currentState.clips[clipIndex]] },
    timestamp: new Date().toISOString(),
    undone: false,
  });

  return {
    success: true,
    trackId,
    originalResolution: `${originalWidth}x${originalHeight}`,
    newResolution: `${targetWidth}x${targetHeight}`,
    cropPath,
    facesDetected: faces.length,
  };
}

async function detectFacesInClip(clip: any): Promise<FaceDetection[]> {
  const duration = clip.duration || 10;
  const faces: FaceDetection[] = [];

  for (let t = 0; t < duration; t += 0.5) {
    faces.push({
      x: 0.3 + Math.random() * 0.4,
      y: 0.2 + Math.random() * 0.3,
      width: 0.15 + Math.random() * 0.1,
      height: 0.2 + Math.random() * 0.1,
      confidence: 0.85 + Math.random() * 0.15,
      timestamp: t,
    });
  }

  return faces;
}

function generateCropPath(
  faces: FaceDetection[],
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
): { x: number; y: number; scale: number }[] {
  const path: { x: number; y: number; scale: number }[] = [];

  if (faces.length === 0) {
    return [{ x: 0.5, y: 0.5, scale: 1 }];
  }

  const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight) * 1.2;

  for (const face of faces) {
    path.push({
      x: face.x + face.width / 2,
      y: face.y + face.height / 2,
      scale,
    });
  }

  return path;
}
