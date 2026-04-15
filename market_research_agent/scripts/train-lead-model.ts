import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// Directorio para guardar los modelos entrenados por empresa
const MODELS_DIR = path.join(process.cwd(), 'data', 'models');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

interface FeatureCounts {
  [feature: string]: {
    [value: string]: {
      total: number;
      converted: number;
    }
  }
}

async function trainModelForCompany(companyId: string) {
  console.log(`\nEntrenando modelo para compañía: ${companyId}...`);

  // Extraer todos los leads de la compañía
  const leads = await prisma.lead.findMany({
    where: { companyId },
    select: {
      id: true,
      email: true,
      source: true,
      campaignId: true,
      country: true,
      convertedToDealId: true,
      status: true
    }
  });

  if (leads.length === 0) {
    console.log('No hay suficientes datos para entrenar.');
    return;
  }

  let totalLeads = leads.length;
  let totalConverted = leads.filter(l => l.convertedToDealId !== null || l.status === 'WON').length;

  if (totalConverted === 0) {
    console.log('Precaución: No hay ventas registradas. El modelo asumirá 0% de probabilidad base.');
    // Smoothing para evitar divisiones por cero
    totalConverted = 1; 
    totalLeads += 2;
  }

  const baseConversionRate = totalConverted / totalLeads;

  // Características a rastrear
  const features: FeatureCounts = {
    source: {},
    campaignId: {},
    country: {},
    emailDomain: {}
  };

  // Llenar conteos
  for (const lead of leads) {
    const isConverted = lead.convertedToDealId !== null || lead.status === 'WON';
    
    // Función helper para contar
    const countFeature = (featureName: string, value: string | null) => {
      const val = value || 'UNKNOWN';
      if (!features[featureName][val]) {
        features[featureName][val] = { total: 0, converted: 0 };
      }
      features[featureName][val].total++;
      if (isConverted) features[featureName][val].converted++;
    };

    countFeature('source', lead.source);
    countFeature('campaignId', lead.campaignId);
    countFeature('country', lead.country);
    
    // Extraer dominio del email
    const emailParts = lead.email ? lead.email.split('@') : [];
    const domain = emailParts.length === 2 ? emailParts[1].toLowerCase() : 'UNKNOWN';
    countFeature('emailDomain', domain);
  }

  // Calcular pesos (Probabilidad Bayesiana P(Feature | Conversion))
  const modelWeights: any = {
    baseConversionRate,
    features: {}
  };

  for (const featureName in features) {
    modelWeights.features[featureName] = {};
    for (const value in features[featureName]) {
      const stats = features[featureName][value];
      // Aplicar Laplace Smoothing
      const prob = (stats.converted + 1) / (stats.total + 2);
      
      // Peso o multiplicador relativo a la base
      // Si prob > baseConversionRate, es un buen indicador
      const weight = prob / baseConversionRate;
      
      modelWeights.features[featureName][value] = {
        prob,
        weight,
        support: stats.total
      };
    }
  }

  // Guardar el modelo en JSON
  const modelPath = path.join(MODELS_DIR, `${companyId}_naive_bayes.json`);
  fs.writeFileSync(modelPath, JSON.stringify(modelWeights, null, 2));

  console.log(`✅ Modelo entrenado y guardado en: ${modelPath}`);
  console.log(`   - Leads Totales: ${leads.length}`);
  console.log(`   - Tasa Base de Conversión: ${(baseConversionRate * 100).toFixed(2)}%`);

  // Fase opcional: Re-puntuar los leads sin convertir recientes usando el modelo
  console.log('Aplicando inferencia a leads recientes sin calificar...');
  const activeLeads = leads.filter(l => l.convertedToDealId === null && l.status !== 'LOST');
  
  let scoredCount = 0;
  for (const lead of activeLeads) {
    // Calcular score
    let finalProb = baseConversionRate;
    const factors: Record<string, number> = {};

    const applyWeight = (featureName: string, value: string | null) => {
      const val = value || 'UNKNOWN';
      if (modelWeights.features[featureName][val]) {
        const weight = modelWeights.features[featureName][val].weight;
        finalProb *= weight;
        factors[featureName] = weight;
      }
    };

    applyWeight('source', lead.source);
    applyWeight('campaignId', lead.campaignId);
    applyWeight('country', lead.country);
    
    const emailParts = lead.email ? lead.email.split('@') : [];
    applyWeight('emailDomain', emailParts.length === 2 ? emailParts[1].toLowerCase() : 'UNKNOWN');

    // Limitar entre 0.01 y 0.99
    finalProb = Math.min(Math.max(finalProb, 0.01), 0.99);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        conversionProbability: finalProb,
        predictionFactors: factors
      }
    });
    scoredCount++;
  }

  console.log(`✅ ${scoredCount} leads re-evaluados con el nuevo modelo predictivo.`);
}

async function runAll() {
  console.log('--- INICIANDO MOTOR DE START PREDICTIVE SCORING ---');
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  
  for (const c of companies) {
    await trainModelForCompany(c.id);
  }
  
  console.log('\n--- ENTRENAMIENTO COMPLETADO ---');
}

runAll().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});
