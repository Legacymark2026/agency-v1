/**
 * Ejemplo de uso de The Multi-Source Engine
 * Asset Scout - The Sintetizador
 */

import { 
  SynthesisAgent, 
  StyleMatcher, 
  CreditManager,
  createImageClient,
  searchStock 
} from '../src/asset-scout';
import { VideoClip } from '../src/agents/types';

// ============================================
// EJEMPLO 1: SÍNTETIZADOR
// ============================================

async function ejemploSintetizador() {
  const clips: VideoClip[] = [
    { id: 'c1', url: 'video1.mp4', duration: 5, resolution: '4K', fps: 60, quality: 'excellent' },
    { id: 'c2', url: 'video2.mp4', duration: 8, resolution: '4K', fps: 60, quality: 'excellent' }
  ];

  const synthesizer = new SynthesisAgent({
    projectId: 'proj-001',
    companyId: 'company-001',
    clips,
    timeline: [
      { id: 's1', type: 'hook', clipIds: ['c1'], duration: 3, transitions: ['none'] },
      { id: 's2', type: 'body', clipIds: ['c1', 'c2'], duration: 8, transitions: ['cut'] },
      { id: 's3', type: 'outro', clipIds: [], duration: 2, transitions: ['fade'] }
    ],
    voiceover: 'El aroma del café gourmet, una experiencia única cada mañana.',
    style: 'luxury',
    platform: 'reels',
    apiKeys: {
      pexels: 'PEXELS_API_KEY',
      midjourney: 'MIDJOURNEY_API_KEY'
    }
  });

  // Ejecutar auditoría
  const audit = await synthesizer.runAudit('GEMINI_API_KEY');

  console.log('📊 Auditoría de Síntetizador:');
  console.log(`   Huecos detectados: ${audit.gaps.length}`);
  console.log(`   Duración faltante: ${audit.missingDuration}s`);
  
  // Ver propuestas
  console.log('\n💡 Propuestas:');
  for (const proposal of audit.proposals) {
    console.log(`   - ${proposal.source}: ${proposal.provider} (${proposal.estimatedCost} créditos)`);
  }

  // Aprobar primera propuesta
  if (audit.proposals.length > 0) {
    const result = await synthesizer.approveProposal(audit.proposals[0].gapId, audit);
    console.log('\n✅ Resultado:', result);
  }

  return audit;
}

// ============================================
// EJEMPLO 2: STYLE MATCHER (Film Grain Injection)
// ============================================

async function ejemploStyleMatcher() {
  const matcher = new StyleMatcher();
  
  // Analizar video base
  const clip: VideoClip = {
    id: 'main-video',
    url: 'main.mp4',
    duration: 20,
    resolution: '4K',
    fps: 60,
    quality: 'excellent',
    focus: 'sharp',
    stability: 'stable',
    lighting: 'dramatic'
  };

  // Crear perfil de estilo
  const profile = matcher.analyzeSourceVideo(clip);
  console.log('🎨 Perfil de estilo:');
  console.log(`   Temperatura: ${profile.temperature}K`);
  console.log(`   Contraste: ${profile.contrast}`);
  console.log(`   Grano: ${profile.grainLevel}%`);
  console.log(`   Tipo de grano: ${profile.grainType}`);

  // Aplicar Film Grain Injection a un asset IA
  const grainConfig = matcher.applyFilmGrainInjection(profile, 'asset-ai-001');
  console.log('\n✨ Film Grain Config:');
  console.log(`   Nivel: ${grainConfig.grainLevel}%`);
  console.log(`   Animación: ${grainConfig.grainAnimation.enabled}`);
  console.log(`   Blend: ${grainConfig.blendMode}`);

  // Validar match
  const assetProfile = { ...profile, grainLevel: 0 }; // Asset IA sin grano
  const validation = matcher.validateMatch(assetProfile, profile);
  console.log('\n🔍 Validación de Match:');
  console.log(`   Es matching: ${validation.isMatch}`);
  console.log(`   Score: ${(validation.score * 100).toFixed(1)}%`);
  console.log(`   Issues: ${validation.issues.join(', ') || 'NINGUNO'}`);

  return grainConfig;
}

// ============================================
// EJEMPLO 3: CRÉDITOS
// ============================================

async function ejemploCreditos() {
  const companyId = 'company-001';

  // Verificar balance
  const balance = await CreditManager.getBalance(companyId);
  console.log('💰 Balance de Créditos:');
  console.log(`   Total: ${balance.totalCredits}`);
  console.log(`   Usados: ${balance.usedCredits}`);
  console.log(`   Disponibles: ${balance.availableCredits}`);

  // Calcular costo de operación
  const cost = CreditManager.calculateCost('midjourney', 'generate');
  console.log(`\n💵 Costo de generar imagen: ${cost} créditos`);

  // Verificar si hay suficientes
  const hasEnough = await CreditManager.hasEnoughCredits(companyId, cost);
  console.log(`\n✅ Tiene suficientes créditos: ${hasEnough}`);

  return balance;
}

// ============================================
// EJEMPLO 4: BÚSQUEDA EN STOCK
// ============================================

async function ejemploStockSearch() {
  // Buscar videos en Pexels
  const result = await searchStock(
    'coffee beans macro',
    'pexels',
    'PEXELS_API_KEY',
    { perPage: 5, orientation: 'portrait' }
  );

  console.log('📹 Resultados de Stock:');
  console.log(`   Encontrados: ${result.results.length}`);
  
  for (const item of result.results) {
    console.log(`   - ${item.provider}: ${item.duration}s, ${item.width}x${item.height}`);
  }

  return result;
}

// ============================================
// EJEMPLO 5: GENERACIÓN CON IA
// ============================================

async function ejemploGeneracionIA() {
  // Generar imagen con Midjourney
  const client = createImageClient('midjourney', 'MJ_API_KEY');
  
  const result = await client.generateImage({
    provider: 'midjourney',
    prompt: 'Cinematic coffee pouring into luxury cup, golden hour lighting, 4k',
    width: 1080,
    height: 1920,
    platform: 'reels',
    style: 'luxury'
  });

  console.log('🖼️ Generación IA:');
  console.log(`   Éxito: ${result.success}`);
  if (result.success) {
    console.log(`   Asset ID: ${result.asset?.id}`);
    console.log(`   Costo: ${result.cost} créditos`);
    console.log(`   Tiempo: ${result.processingTime}ms`);
  } else {
    console.log(`   Error: ${result.error}`);
  }

  return result;
}

// ============================================
// EJECUTAR EJEMPLOS
// ============================================

// descomenta para ejecutar
// ejemploSintetizador().then(console.log).catch(console.error);
// ejemploStyleMatcher().then(console.log).catch(console.error);
// ejemploCreditos().then(console.log).catch(console.error);
// ejemploStockSearch().then(console.log).catch(console.error);
// ejemploGeneracionIA().then(console.log).catch(console.error);

export default {
  ejemploSintetizador,
  ejemploStyleMatcher,
  ejemploCreditos,
  ejemploStockSearch,
  ejemploGeneracionIA
};