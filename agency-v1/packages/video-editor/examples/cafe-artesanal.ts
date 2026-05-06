import { createVideoProject, Clip, AudioTrack } from '../src/index';

const clips: Clip[] = [
  {
    id: 'A-1', type: 'macro', duration: 5, resolution: '4K', fps: 60,
    quality: 'excellent', focus: 'sharp', stability: 'stable', lighting: 'dramatic',
    semanticTags: ['coffee', 'falling', 'slow-mo'], intention: 'texture'
  },
  {
    id: 'A-2', type: 'macro', duration: 4, resolution: '4K', fps: 60,
    quality: 'excellent', focus: 'sharp', stability: 'stable', lighting: 'dramatic',
    semanticTags: ['coffee', 'beans', 'macro'], intention: 'texture'
  },
  {
    id: 'B-1', type: 'close-up', duration: 3, resolution: '4K', fps: 60,
    quality: 'good', focus: 'sharp', stability: 'stable', lighting: 'dramatic',
    semanticTags: ['french-press', 'steam', 'process'], intention: 'process'
  },
  {
    id: 'B-2', type: 'close-up', duration: 3, resolution: '4K', fps: 60,
    quality: 'good', focus: 'sharp', stability: 'stable', lighting: 'dramatic',
    semanticTags: ['french-press', 'filtering', 'steam'], intention: 'process'
  },
  {
    id: 'B-3', type: 'close-up', duration: 2.5, resolution: '4K', fps: 60,
    quality: 'good', focus: 'soft', stability: 'stable', lighting: 'artificial',
    semanticTags: ['french-press', 'pressing', 'vapor'], intention: 'process'
  },
  {
    id: 'C-1', type: 'branding', duration: 3, resolution: '4K', fps: 30,
    quality: 'good', focus: 'sharp', stability: 'stable', lighting: 'natural',
    semanticTags: ['logo', 'packaging', 'brand'], intention: 'branding'
  },
  {
    id: 'C-2', type: 'branding', duration: 4, resolution: '4K', fps: 30,
    quality: 'excellent', focus: 'sharp', stability: 'stable', lighting: 'natural',
    semanticTags: ['product', 'cup', 'ceramic', 'final'], intention: 'reward'
  }
];

const audioTracks: AudioTrack[] = [
  {
    type: 'music', source: 'jazz-lofi-90bpm.mp3', lufs: -12,
    duration: 20, bpm: 90
  }
];

const editor = createVideoProject({
  type: 'product-showcase',
  format: '9:16',
  style: 'luxury',
  rhythm: 'medium',
  platform: 'reels',
  duration: 18,
  hookDuration: 3
});

editor.addClips(clips);
editor.addAudioTracks(audioTracks);

console.log('=== ANÁLISIS DE BRUTO ===');
const analysis = editor.analyzeFootage(clips);
analysis.forEach((data, clipId) => {
  console.log(`${clipId}: Score ${data.score} | Hero: ${data.heroShot} | Intención: ${data.intention}`);
  console.log(`   → ${data.recommendation}`);
});

console.log('\n=== TIMELINE GENERADO ===');
const timeline = editor.generateTimeline(clips);
console.log(`Duración total: ${timeline.totalDuration}s`);
console.log(`Cortes totales: ${timeline.cuts} (promedio: ${timeline.averageCutDuration}s/corte)`);

console.log('\n=== SEGMENTO HOOK ===');
console.log(JSON.stringify(timeline.segments.hook, null, 2));

console.log('\n=== SPEED RAMPING (Segmento B) ===');
const ramp = editor.applySpeedRamping('B-1', { startSpeed: 30, endSpeed: 60, easing: 'ease-out' });
console.log(`Speed ramp aplicado: ${ramp.clipId} (${ramp.keyframes[0].speed}% → ${ramp.keyframes[1].speed}%)`);

console.log('\n=== COLOR GRADE (Warm Artisan) ===');
clips.forEach(clip => {
  const grade = editor.applyColorGrade(clip.id, 'warm-artisan');
  console.log(`${clip.id}: LUT=${grade.lut}, Temp=${grade.temperature}K`);
});

console.log('\n=== AUDIO MIX ===');
const audioMix = editor.generateAudioMix(audioTracks);
console.log(`Master LUFS: ${audioMix.masterLUFS}`);
console.log('Capas:', audioMix.layers);

console.log('\n=== TEXTO EN ZONA SEGURA ===');
editor.addTextOverlay({
  text: 'El momento perfecto',
  position: 'center',
  animation: 'fade',
  font: 'Playfair Display',
  color: '#FFFFFF',
  safeZone: false,
  duration: 3,
  startTime: 0
});
editor.addTextOverlay({
  text: '100% artesanal',
  position: 'bottom',
  animation: 'slide',
  font: 'Playfair Display',
  color: '#FFFFFF',
  safeZone: false,
  duration: 2,
  startTime: 12
});

console.log('\n=== VOZ EN OFF ===');
const voiceoverScript = editor.generateVoiceoverScript('product', 'warm');
console.log(`Script: "${voiceoverScript}"`);

console.log('\n=== CALIDAD CHECKLIST ===');
const project = editor.exportProject();
const check = project.qualityCheck;
console.log(`Status: ${check.passed ? '✅ APROBADO' : '❌ FALLIDO'}`);
if (check.issues.length > 0) {
  console.log('Issues:', check.issues);
}

console.log('\n=== RENDER OUTPUTS ===');
const outputs = editor.generateRenderOutputs();
outputs.forEach(o => {
  console.log(`${o.filename}: ${o.resolution} | ${o.codec}`);
});

console.log('\n✅ MÓDULO EJECUTADO CORRECTAMENTE');