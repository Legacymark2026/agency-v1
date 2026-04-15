import { prisma } from '@/lib/prisma';
import { hashData } from '@/lib/utils/crypto-hasher';
import { syncWhalesToMeta } from '../audiences/meta';

// Unidimensional K-Means para LTV
function kMeans1D(data: number[], k: number, maxIterations = 50): number[][] {
  if (data.length === 0) return [];
  if (data.length <= k) return data.map(d => [d]);

  // Inicialización (k cuantiles o random)
  const min = Math.min(...data);
  const max = Math.max(...data);
  let centroids = Array.from({ length: k }, (_, i) => min + (max - min) * (i / (k - 1)));

  let clusters: number[][] = [];
  
  for (let iter = 0; iter < maxIterations; iter++) {
    clusters = Array.from({ length: k }, () => []);

    // Asignación
    for (const val of data) {
      let minDist = Infinity;
      let clusterIdx = 0;
      for (let i = 0; i < k; i++) {
        const dist = Math.abs(val - centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          clusterIdx = i;
        }
      }
      clusters[clusterIdx].push(val);
    }

    // Actualización
    let changed = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      const newCentroid = clusters[i].reduce((a, b) => a + b, 0) / clusters[i].length;
      if (Math.abs(newCentroid - centroids[i]) > 0.001) {
        changed = true;
        centroids[i] = newCentroid;
      }
    }

    if (!changed) break;
  }

  // Ordenar clusters por valor (de menor a mayor LTV)
  return clusters.sort((a, b) => {
    const avgA = a.length ? a.reduce((sum, v) => sum + v, 0) / a.length : 0;
    const avgB = b.length ? b.reduce((sum, v) => sum + v, 0) / b.length : 0;
    return avgA - avgB;
  });
}

export async function processLTVClusters(companyId: string) {
  console.log(`[ML] Initiating LTV Clustering for Company: ${companyId}`);

  // Fetch all won deals
  const deals = await prisma.deal.findMany({
    where: { 
      companyId, 
      status: 'WON'
    },
    include: { lead: true }
  });

  if (deals.length < 10) {
    console.log(`[ML] Not enough deals (${deals.length}) to cluster reasonably. Minimum 10.`);
    return;
  }

  // Aggregate LTV per Lead Email
  const ltvMap = new Map<string, number>();
  for (const deal of deals) {
    if (!deal.lead?.email) continue;
    const current = ltvMap.get(deal.lead.email) || 0;
    ltvMap.set(deal.lead.email, current + deal.value);
  }

  const ltvValues = Array.from(ltvMap.values());
  
  // Cluster en 3: Low, Average, WHALES
  const clusters = kMeans1D(ltvValues, 3);
  
  // WHALES = el último cluster (mayor valor)
  const whalesCluster = clusters[2];
  if (!whalesCluster || whalesCluster.length === 0) return;

  const minWhaleValue = Math.min(...whalesCluster);
  
  // Encontrar emails de ballenas
  const whaleEmails: string[] = [];
  for (const [email, ltv] of ltvMap.entries()) {
    if (ltv >= minWhaleValue) {
      whaleEmails.push(email);
    }
  }

  console.log(`[ML] Clustering Complete. Found ${whaleEmails.length} WHALES (LTV >= $${minWhaleValue.toLocaleString()})`);

  // Extraer teléfonos si existen para esas ballenas
  const whaleLeads = await prisma.lead.findMany({
    where: {
      companyId,
      email: { in: whaleEmails }
    },
    select: { email: true, phone: true }
  });

  // Hashear (Requerido por Meta)
  const hashedWhales = whaleLeads.map(l => ({
    email: hashData(l.email),
    phone: hashData(l.phone) 
  }));

  // Sincronizar con Meta Custom Audiences
  await syncWhalesToMeta(companyId, hashedWhales);
}
