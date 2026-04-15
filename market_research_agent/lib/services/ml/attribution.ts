import { prisma } from '@/lib/prisma';

// Helper matrix functions
function sumArray(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export async function calculateAttribution(companyId: string) {
  console.log(`[ML] Calculating Multi-Touch Attribution for Company: ${companyId}`);

  // 1. Extraer todos los leads y sus eventos para formar "rutas" (Paths)
  const leads = await prisma.lead.findMany({
    where: { companyId },
    include: {
      marketingEvents: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (leads.length === 0) return { error: 'No data' };

  // RUTAS: { id, path: ['FB_ADS', 'GOOGLE_SEARCH'], isConverted: boolean }
  const paths = leads.map(l => {
    // Si no hay eventos, asumimos su 'source' como única interacción
    let interactions = l.marketingEvents.map(e => e.utmSource || e.referrer || 'DIRECT');
    if (interactions.length === 0) {
      interactions = [l.source || 'UNK'];
    }
    
    // Simplificar canales comunes
    interactions = interactions.map(src => {
        const s = src.toLowerCase();
        if (s.includes('facebook') || s.includes('ig') || s.includes('meta')) return 'META';
        if (s.includes('google')) return 'GOOGLE';
        if (s.includes('tiktok')) return 'TIKTOK';
        if (s.includes('linkedin')) return 'LINKEDIN';
        if (s.includes('direct')) return 'DIRECT';
        return 'OTHER';
    });

    // Eliminar duplicados consecutivos (B -> B -> C = B -> C)
    const compressedPath = interactions.filter((val, i, arr) => i === 0 || val !== arr[i - 1]);

    return {
      id: l.id,
      path: compressedPath,
      isConverted: l.status === 'WON' || l.convertedToDealId !== null
    };
  });

  // Nodos Únicos
  const channels = new Set<string>();
  paths.forEach(p => p.path.forEach(ch => channels.add(ch)));
  const channelList = Array.from(channels);
  
  // Agregar Start, Null y Conversion
  const states = ['START', ...channelList, 'CONV', 'NULL'];
  
  // Inicializar Matriz de Transiciones
  const transitions: Record<string, Record<string, number>> = {};
  for (const s1 of states) {
    transitions[s1] = {};
    for (const s2 of states) {
      transitions[s1][s2] = 0;
    }
  }

  // Contabilizar saltos
  let totalPaths = 0;
  for (const p of paths) {
    totalPaths++;
    let currentState = 'START';
    
    for (const step of p.path) {
      // De estado actual a paso
      transitions[currentState][step] += 1;
      currentState = step;
    }

    if (p.isConverted) {
      transitions[currentState]['CONV'] += 1;
    } else {
      transitions[currentState]['NULL'] += 1;
    }
  }

  // Convertir conteos a probabilidades
  const probMatrix: Record<string, Record<string, number>> = {};
  for (const fromState of states) {
    probMatrix[fromState] = {};
    const totalOut = Object.values(transitions[fromState]).reduce((a, b) => a + b, 0);
    
    for (const toState of states) {
      if (totalOut === 0) {
        probMatrix[fromState][toState] = (fromState === toState) ? 1 : 0; // Absorbed state
      } else {
        probMatrix[fromState][toState] = transitions[fromState][toState] / totalOut;
      }
    }
  }

  // CÁLCULO DE EFECTO DE REMOCIÓN (Removal Effect)
  // 1. Probabilidad base de conversión del sistema (P_base)
  // Simplificado para este script:
  const baseConversionRate = paths.filter(p => p.isConverted).length / Math.max(1, paths.length);
  
  // 2. Removal Effect por canal
  const removalEffects: Record<string, number> = {};
  
  for (const channel of channelList) {
    // Para calcular el removal effect "real" matemáticamente se usa álgebra matricial.
    // Aquí implementamos un aproximado heurístico: ¿Qué % de rutas ganadas PASARON por este canal?
    const wonPaths = paths.filter(p => p.isConverted);
    const wonPathsWithChannel = wonPaths.filter(p => p.path.includes(channel));
    
    // Proporción de éxito donde este canal participó (Efecto Aproximado)
    const effect = wonPathsWithChannel.length / Math.max(1, wonPaths.length);
    removalEffects[channel] = effect;
  }

  // Normalizar los removal effects para que sumen 1 (Atribución)
  const totalEffect = sumArray(Object.values(removalEffects));
  const finalAttribution: Record<string, number> = {};
  
  for (const ch in removalEffects) {
    finalAttribution[ch] = totalEffect > 0 ? (removalEffects[ch] / totalEffect) : 0;
  }

  console.log('--- Multi-Touch Attribution (Markov Heuristic) ---');
  for (const ch in finalAttribution) {
    console.log(`${ch}: ${(finalAttribution[ch] * 100).toFixed(1)}%`);
  }

  // Esto devuelve un JSON que el Dashboard de Analytics puede consumir en vivo
  return {
    baseConversionRate,
    attributionWeights: finalAttribution,
    totalAnalyzedPaths: totalPaths,
    transitions: probMatrix
  };
}
