export { analyzeAudioTrack } from './analyze-audio';
export type { AudioAnalysis, AudioWord } from './analyze-audio';

export { detectVisualScenes } from './detect-scenes';
export type { VisualAnalysis, SceneChange } from './detect-scenes';

export { cutTrack, removeSilenceSegments } from './cut-track';
export type { CutTrackArgs, CutTrackResult } from './cut-track';

export { applySmartCrop } from './smart-crop';
export type { SmartCropArgs, SmartCropResult, FaceDetection } from './smart-crop';

export { injectBRoll } from './inject-broll';
export type { InjectBRollArgs, InjectBRollResult, BRollAsset } from './inject-broll';
