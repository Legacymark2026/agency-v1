import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { dispatchConversion } from '@/lib/services/conversions/dispatcher';

const MODELS_DIR = path.join(process.cwd(), 'data', 'models');

export async function scoreLeadAndDispatch(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        crmCompany: true
      }
    });

    if (!lead) return;

    const companyId = lead.companyId;
    const modelPath = path.join(MODELS_DIR, `${companyId}_naive_bayes.json`);

    if (!fs.existsSync(modelPath)) {
      console.log(`[ML] No scoring model found for company ${companyId}. Skipping inference.`);
      return;
    }

    const modelWeights = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
    let finalProb = modelWeights.baseConversionRate;
    const factors: Record<string, number> = {};

    const applyWeight = (featureName: string, value: string | null) => {
      const val = value || 'UNKNOWN';
      if (modelWeights.features[featureName]?.[val]) {
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

    finalProb = Math.min(Math.max(finalProb, 0.01), 0.99); // Limitar a max 99%

    // Guardar predicción
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        conversionProbability: finalProb,
        predictionFactors: factors
      }
    });

    console.log(`[ML] Lead ${lead.id} scored: ${(finalProb * 100).toFixed(1)}% probability.`);

    // Si el Lead es "Ballena" (Probabilidad > 80%) y aún no se le ha marcado como alta calidad
    // Se despacha de forma temprana como "Qualified Lead" para VBO S2S a Meta/Google.
    if (finalProb > 0.8) {
      console.log(`[ML] High Value Lead Predicted! P>80%. Dispatching early S2S signal.`);
      // No bloqueante
      dispatchConversion({
        leadId: lead.id,
        eventName: 'Lead', // Para Google se puede mapear a MQL/SQL, para FB será Lead
        value: 50, // Valor base predictivo definido en VBO para MQLs
        currency: "USD",
        timestamp: Date.now(),
        userData: {
            email: lead.email,
            phone: lead.phone,
            ip: lead.ipAddress,
            userAgent: lead.userAgent,
            gclid: lead.gclid,
            fbclid: lead.fbclid,
            li_fat_id: lead.li_fat_id,
            ttclid: lead.ttclid,
            fbp: lead.fbp,
            fbc: lead.fbc
        }
      }, companyId).catch(console.error);
    }

  } catch (error) {
    console.error("[ML] Error scoring lead:", error);
  }
}
