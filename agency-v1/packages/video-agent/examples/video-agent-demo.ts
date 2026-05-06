/**
 * Ejemplo de uso del Video Editor Agent
 * Este código muestra cómo integrar el agente en tu aplicación
 */

import { createVideoEditorAgent, VideoProject } from '../src/index';

// ============================================
// EJEMPLO 1: CREAR PROYECTO Y GENERAR TIMELINE
// ============================================

async function demoFullWorkflow() {
  const agent = createVideoEditorAgent('company-123');

  // 1. Crear proyecto
  const project = await agent.createProject({
    name: 'Café Artesanal - Reels',
    description: 'Video de producto para Instagram Reels',
    outputFormat: '9:16',
    platform: 'reels',
    style: 'luxury',
    duration: 18,
    hookDuration: 3,
    clips: [
      { id: 'clip-1', url: 's3://brutos/cafe-granos.mp4', duration: 5, resolution: '4K', fps: 60, tags: ['coffee', 'falling'] },
      { id: 'clip-2', url: 's3://brutos/prensa-francesa.mp4', duration: 4, resolution: '4K', fps: 60, tags: ['process', 'steam'] },
      { id: 'clip-3', url: 's3://brutos/taza-final.mp4', duration: 3, resolution: '4K', fps: 30, tags: ['product', 'final'] },
      { id: 'clip-4', url: 's3://brutos/logo-packaging.mp4', duration: 2, resolution: '4K', fps: 30, tags: ['branding', 'logo'] },
      { id: 'clip-5', url: 's3://brutos/beans-macro.mp4', duration: 4, resolution: '4K', fps: 60, tags: ['texture', 'macro'] }
    ],
    audioUrl: 's3://audios/jazz-lofi-90bpm.mp3'
  });

  console.log('✅ Proyecto creado:', project.id);

  // 2. Analizar footage automáticamente
  const analysis = await agent.analyzeFootage(project.id);
  console.log('📊 Análisis de footage:', analysis);

  // 3. Generar timeline automático
  const timeline = await agent.generateTimeline(project.id);
  console.log('🎬 Timeline generado:', timeline.length, 'segmentos');

  // 4. Generar 3 versiones alternativas
  const versions = await agent.generateVersions(project.id);
  console.log('📱 Versiones generadas:', versions.map(v => `${v.version}: ${v.name}`));

  // 5. Verificación de calidad
  const qualityCheck = await agent.runQualityCheck(project.id);
  console.log('🔍 Quality Check:', qualityCheck.passed ? 'APROBADO' : 'FALLIDO');
  if (qualityCheck.issues.length > 0) {
    console.log('   Issues:', qualityCheck.issues);
  }

  return project;
}

// ============================================
// EJEMPLO 2: CONTROL HÍBRIDO - OVERRIDE MANUAL
// ============================================

async function demoManualOverride(projectId: string) {
  const agent = createVideoEditorAgent('company-123');

  // El usuario pide cambios específicos
  const overrides = [
    "Haz un match-cut entre el clip de granos y la taza final",
    "En el segundo 5, quiero que el zoom sea más lento",
    "Satura más los dorados en el segmento de branding",
    "Cambia la transición del hook a un fade lento",
    "Añade texto '100% ARTESANAL' en el segmento final"
  ];

  for (const instruction of overrides) {
    console.log(`\n📝 Override solicitado: "${instruction}"`);
    
    const result = await agent.applyManualOverride(projectId, instruction);
    console.log(`   ✅ Aplicado: ${result.status}`);
    console.log(`   Tipo detectado: ${result.type}`);
  }
}

// ============================================
// EJEMPLO 3: VOZ EN OFF
// ============================================

async function demoVoiceover(projectId: string) {
  const agent = createVideoEditorAgent('company-123');

  const voiceover = await agent.generateVoiceover(
    projectId,
    'Transmitir exclusividad, aroma artesanal y calidad premium para una cafetería de lujo'
  );

  console.log('🎤 Voz en off generada:', voiceover);
  return voiceover;
}

// ============================================
// EJEMPLO 4: EXPORTAR DATOS
// ============================================

async function demoExport(projectId: string) {
  const agent = createVideoEditorAgent('company-123');

  const exportData = await agent.exportProjectData(projectId);
  
  console.log('\n📦 Datos exportados:');
  console.log('- Nombre:', exportData.name);
  console.log('- Formato:', exportData.format);
  console.log('- Plataforma:', exportData.platform);
  console.log('- Estilo:', exportData.style);
  console.log('- Timeline:', exportData.timeline?.length, 'segmentos');
  console.log('- Voiceover:', exportData.voiceover);
  console.log('- Quality:', exportData.qualityCheck.passed ? '✅' : '❌');
  
  return exportData;
}

// ============================================
// MAPEO DE COMANDOS DE VOZ/TEXTO
// ============================================

export const COMMAND_MAPPINGS = {
  // Cortes
  'match-cut': { type: 'transition', value: 'match-cut' },
  'jump-cut': { type: 'transition', value: 'jump-cut' },
  'corte': { type: 'cut', value: 'cut' },
  'fade': { type: 'transition', value: 'fade' },
  'dissolve': { type: 'transition', value: 'dissolve' },

  // Velocidad
  'slow-motion': { type: 'speed', value: 30 },
  'cámara lenta': { type: 'speed', value: 50 },
  'acelerar': { type: 'speed', value: 150 },
  'speed ramp': { type: 'speed', value: 'ramp' },

  // Color
  'saturar': { type: 'color', property: 'saturation', value: 1.2 },
  'contrastar': { type: 'color', property: 'contrast', value: 1.3 },
  'temperatura cálida': { type: 'color', property: 'temperature', value: 4000 },
  'dorados': { type: 'color', property: 'lut', value: 'gold-premium' },

  // Texto
  'añadir texto': { type: 'text', action: 'add' },
  'quitar texto': { type: 'text', action: 'remove' },
  'animar texto': { type: 'text', animation: 'fade' },

  // Audio
  'subir música': { type: 'audio', track: 'music', property: 'volume', value: 1.2 },
  'bajar voz': { type: 'audio', track: 'voice', property: 'volume', value: 0.8 },
  'ducking': { type: 'audio', property: 'ducking', value: true }
};

// ============================================
// EJEMPLO DE INTEGRACIÓN CON UI
// ============================================

export interface UIInteraction {
  userInput: string;
  timestamp: Date;
  type: 'voice' | 'text' | 'button';
  context?: string;
}

// Función que procesa la interacción del usuario
export async function processUserCommand(
  projectId: string,
  command: string,
  context?: string
): Promise<{ success: boolean; message: string; changes?: any }> {
  const agent = createVideoEditorAgent('company-123');
  
  // Detectar tipo de comando
  const isVoice = command.includes('haz') || command.includes('cambia') || command.includes('quiero');
  const isSpecific = Object.keys(COMMAND_MAPPINGS).some(k => command.toLowerCase().includes(k));

  if (isSpecific) {
    // Comando específico - aplicar directamente
    const result = await agent.applyManualOverride(projectId, command);
    return {
      success: true,
      message: `✅ "${command}" aplicado correctamente`,
      changes: result
    };
  } else {
    // Comando libre - usar IA para interpretar
    const result = await agent.applyManualOverride(projectId, command);
    return {
      success: true,
      message: `🔄 Comando procesado: "${command}"`,
      changes: result
    };
  }
}

// ============================================
// EXPORTAR TODO
// ============================================

export default {
  createVideoEditorAgent,
  COMMAND_MAPPINGS,
  processUserCommand,
  demoFullWorkflow,
  demoManualOverride,
  demoVoiceover,
  demoExport
};