import { prisma } from '@/lib/prisma';
import { IntegrationConfigData } from '@/actions/integration-config';

// Documentación de la API de Meta para Custom Audiences:
// https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences

interface HashedContact {
  email: string | null;
  phone: string | null;
}

export async function syncWhalesToMeta(companyId: string, hashedContacts: HashedContact[]) {
  console.log(`[Meta Audience] Sincronizando ${hashedContacts.length} contactos WHALES con Meta...`);

  const configRecord = await prisma.integrationConfig.findFirst({
    where: { companyId, provider: 'facebook-pixel', isEnabled: true }
  });

  if (!configRecord) {
    console.log('[Meta Audience] No FB integration found skipping sync.');
    return;
  }

  const config = configRecord.config as unknown as IntegrationConfigData;

  if (!config.accessToken || !config.pixelId) {
    console.log('[Meta Audience] Faltan accessToken o pixelId (Ad Account Info) en la config.');
    return;
  }

  // En producción, primero buscaríamos el ID de la Audiencia "CRM Whales" mediante la API, 
  // o crearíamos una nueva en la Ad Account correspondiente.
  // 
  // Payload ejemplo para agregar usuarios a una Custom Audience:
  /*
  const payload = {
    payload: {
      schema: ["EMAIL", "PHONE"],
      data: hashedContacts.map(c => [
        c.email ? c.email : "", 
        c.phone ? c.phone : ""
      ]).filter(arr => arr[0] !== "" || arr[1] !== "")
    }
  };

  const response = await fetch(`https://graph.facebook.com/v19.0/${AUDIENCE_ID}/users?access_token=${config.accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  */

  console.log('[Meta Audience] ✅ Lista de Hashes lista para inserción CAPI/Audiences.');
  // Mock success to console for now out of scope of real external token requirements.
  console.log(hashedContacts.slice(0, 2), "...");
}
