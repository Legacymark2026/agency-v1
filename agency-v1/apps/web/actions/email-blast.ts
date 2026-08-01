'use server';

import { auth } from '@/lib/auth';
import { enforceQuota } from '@/lib/quotas';
import { prisma } from '@/lib/prisma';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}, retries = 3, timeoutMs?: number) {
  const isMutation = options.method && options.method !== 'GET';
  const effectiveTimeout = timeoutMs ?? (isMutation ? 30000 : 5000);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), effectiveTimeout);

      const res = await fetch(`${GATEWAY_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });

      clearTimeout(timeout);

      if (res.ok) {
        return await res.json();
      }

      const err = await res.json().catch(() => ({ error: res.statusText }));
      const isDegraded = res.status === 502 || res.status === 503 || res.status === 504;

      if (isDegraded && attempt < retries) {
        const delay = Math.min(600 * attempt, 1500);
        console.warn(`[gw] Microservice unavailable (Attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      const detailMsg = err.reason || err.error || err.message || res.statusText || `Error ${res.status}`;
      if (isDegraded) {
        throw new Error(`El microservicio (${err.service || 'marketing'}) no responde (${detailMsg}). Por favor verifica que el contenedor esté corriendo.`);
      }

      throw new Error(detailMsg);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (attempt < retries) {
          console.warn(`[gw] Request timeout (${effectiveTimeout}ms) on attempt ${attempt}/${retries}. Retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        throw new Error(isMutation ? 'El envío tardó más de lo esperado en procesar todos los correos. Se sigue ejecutando en segundo plano.' : 'Tiempo de espera agotado al conectar con el servidor.');
      }

      const isTransient = err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.message?.includes('fetch failed');
      if (attempt < retries && isTransient) {
        const delay = Math.min(600 * attempt, 1500);
        console.warn(`[gw] Network error on attempt ${attempt}/${retries}: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export interface RecipientInput {
  email: string;
  name?: string;
  [key: string]: string | undefined;
}

export interface CreateEmailBlastInput {
  name: string;
  subject: string;
  htmlBody: string;
  designJson?: any;
  isAbTest?: boolean;
  subjectB?: string;
  htmlBodyB?: string;
  fromName?: string;
  fromEmail?: string;
  scheduledAt?: Date | null;
  recipients: RecipientInput[];
}

// ── Obtener empresa asignada al usuario ─────────────────────────────────

async function getCompanyId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');

  // 1. Búsqueda directa en Base de Datos PostgreSQL
  try {
    const cu = await prisma.companyUser.findFirst({
      where: { userId: session.user.id },
      select: { companyId: true }
    });
    if (cu?.companyId) return cu.companyId;
  } catch (e) {
    console.warn('[getCompanyId] DB lookup notice:', e);
  }

  // 2. Intento por API Gateway
  try {
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    if (cuRes.ok) {
      const cuData = await cuRes.json();
      if (cuData?.data?.companyId) return cuData.data.companyId;
    }
  } catch (e) {
    console.warn('[getCompanyId] Gateway lookup notice:', e);
  }

  // 3. Fallback a primera empresa disponible
  const defaultCompany = await prisma.company.findFirst({ select: { id: true } });
  if (defaultCompany?.id) return defaultCompany.id;

  throw new Error('Sin empresa asignada');
}

// ── Crear un blast ───────────────────────────────────────────────────────

export async function createEmailBlast(input: CreateEmailBlastInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'No autenticado. Por favor inicia sesión.' };
    const companyId = await getCompanyId();

    // Verificar cuota de emails del plan defensivamente
    try {
      const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}`).catch(() => null);
      if (companyRes?.ok) {
        const companyData = await companyRes.json();
        const tier = companyData?.data?.subscriptionTier || 'free';

        const campaignQuota = await enforceQuota(companyId, 'campaigns', tier);
        if (!campaignQuota.allowed) {
          return {
            success: false,
            error: `Límite de campañas alcanzado para el plan ${tier.toUpperCase()}. Límite: ${campaignQuota.limit}. Mejora tu plan para continuar.`
          };
        }

        const emailQuota = await enforceQuota(companyId, 'emails_per_month', tier);
        if (!emailQuota.allowed) {
          return {
            success: false,
            error: `Límite de emails mensuales alcanzado (${emailQuota.limit.toLocaleString()} emails/${tier} plan). El contador se resetea el 1ro del próximo mes.`
          };
        }
      }
    } catch (quotaErr: any) {
      if (quotaErr.message?.includes('Límite')) return { success: false, error: quotaErr.message };
      console.warn('[createEmailBlast] Quota verification notice:', quotaErr);
    }

    if (!Array.isArray(input.recipients) || input.recipients.length === 0) {
      return { success: false, error: 'Debes incluir al menos un destinatario válido para crear la campaña.' };
    }

    const res = await gw('/api/email-blast', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        recipients: input.recipients,
        companyId,
        createdById: session.user.id
      })
    });

    const blastObj = res?.blast || res;
    return { success: true, blast: blastObj, recipients };
  } catch (err: any) {
    console.error('[createEmailBlast Server Action Error]:', err);
    return { success: false, error: err?.message || 'Ocurrió un error al procesar la campaña en el servidor.' };
  }
}

// ── Obtener lista de blasts de la empresa ─────────────────────────────────

export async function getEmailBlasts() {
  try {
    const companyId = await getCompanyId();
    const res = await gw(`/api/email-blast?companyId=${companyId}`, {}, 2, 1500);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.blasts)) return res.blasts;
    return [];
  } catch (error) {
    console.error('[getEmailBlasts] Failed to get email blasts:', error);
    return [];
  }
}

// ── Enviar un blast ───────────────────────────────────────────────────────

export async function sendEmailBlast(blastId: string) {
  try {
    let companyId = 'default';
    try { companyId = await getCompanyId(); } catch {}

    const res = await gw(`/api/email-blast/${blastId}/send`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify({ companyId })
    });
    return { success: true, queued: true, message: 'La campaña ha sido encolada para su envío.', data: res };
  } catch (error: any) {
    console.error('[sendEmailBlast Server Action Error]:', error);
    return { success: false, error: error.message || 'Error al enviar la campaña' };
  }
}

// ── Reintentar envío a fallidos / pendientes ──────────────────────────────

export async function retryFailedEmailBlast(blastId: string) {
  try {
    let companyId = 'default';
    try { companyId = await getCompanyId(); } catch {}

    const res = await gw(`/api/email-blast/${blastId}/retry`, {
      method: 'POST',
      headers: { 'x-company-id': companyId },
      body: JSON.stringify({ companyId })
    });
    return { success: true, queued: true, message: 'Contactos reencolados para reintento.', data: res };
  } catch (error: any) {
    console.error('[retryFailedEmailBlast Server Action Error]:', error);
    return { success: false, error: error.message || 'Error al reintentar la campaña' };
  }
}

// ── Estadísticas de un blast ──────────────────────────────────────────────

export async function getEmailBlastStats(blastId: string) {
  try {
    const companyId = await getCompanyId();
    const blast = await gw(`/api/email-blast/${blastId}?companyId=${companyId}`);
    return blast;
  } catch (error: any) {
    console.error('[getEmailBlastStats Error]:', error);
    return { error: error.message || 'Error al obtener estadísticas de la campaña' };
  }
}

// ── Eliminar un blast ─────────────────────────────────────────────────────

export async function deleteEmailBlast(blastId: string) {
  try {
    const companyId = await getCompanyId();
    await gw(`/api/email-blast/${blastId}?companyId=${companyId}`, {
      method: 'DELETE'
    });
    return { success: true };
  } catch (error: any) {
    console.error('[deleteEmailBlast Error]:', error);
    return { success: false, error: error.message || 'Error al eliminar campaña' };
  }
}

export async function deleteEmailBlasts(blastIds: string[]) {
  try {
    const companyId = await getCompanyId();
    await gw('/api/email-blast/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ blastIds, companyId })
    });
    return { success: true };
  } catch (error: any) {
    console.error('[deleteEmailBlasts Error]:', error);
    return { success: false, error: error.message || 'Error al eliminar campañas' };
  }
}

// ── Clonar un blast ───────────────────────────────────────────────────────

export async function cloneEmailBlast(blastId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'No autenticado' };
    const companyId = await getCompanyId();

    const clone = await gw(`/api/email-blast/${blastId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ companyId, userId: session.user.id })
    });
    return { success: true, clone };
  } catch (error: any) {
    console.error('[cloneEmailBlast Error]:', error);
    return { success: false, error: error.message || 'Error al clonar campaña' };
  }
}

// ── Enviar email de prueba ────────────────────────────────────────────────

export async function sendTestEmail(subject: string, html: string, toEmail: string) {
  try {
    const res = await gw('/api/email-blast/test', {
      method: 'POST',
      body: JSON.stringify({ subject, html, toEmail })
    });
    return { success: true, ...res };
  } catch (error: any) {
    console.error('[sendTestEmail Error]:', error);
    return { success: false, error: error.message || 'Error al enviar email de prueba' };
  }
}

// ── Configuración de Integración de Correo por Empresa ──────────────────────

export async function getEmailIntegrationConfig() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'No autenticado' };
    const companyId = await getCompanyId();

    const config = await prisma.integrationConfig.findFirst({
      where: { companyId, provider: { in: ['email', 'resend', 'smtp'] } }
    });

    return { success: true, config: config?.config || null, provider: config?.provider || 'resend' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveEmailIntegrationConfig(provider: string, configData: { apiKey?: string; host?: string; port?: number; user?: string; pass?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'No autenticado' };
    const companyId = await getCompanyId();

    await prisma.integrationConfig.upsert({
      where: {
        companyId_provider: {
          companyId,
          provider
        }
      },
      update: {
        config: configData as any,
        isEnabled: true,
        updatedAt: new Date()
      },
      create: {
        companyId,
        provider,
        config: configData as any,
        isEnabled: true
      }
    });

    return { success: true, message: 'Credenciales de correo guardadas exitosamente.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al guardar credenciales' };
  }
}

// ── Obtener suscriptores de una lista de audiencia ────────────────────────

export async function getAudienceListSubscribers(listId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'No autenticado' };
    const companyId = await getCompanyId();

    const subscribers = await prisma.audienceSubscriber.findMany({
      where: { listId, status: 'SUBSCRIBED', companyId },
      select: { email: true, name: true, customFields: true }
    });

    const recipients: RecipientInput[] = subscribers.map(s => ({
      email: s.email,
      name: s.name || undefined,
      ...(typeof s.customFields === 'object' && s.customFields ? s.customFields as any : {})
    }));

    return { success: true, recipients };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al cargar suscriptores de la lista' };
  }
}
