'use server';

import { auth } from '@/lib/auth';
import { enforceQuota } from '@/lib/quotas';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Gateway error ${res.status}`);
  }
  return res.json();
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

  const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
  const cuData = await cuRes.json();
  if (!cuRes.ok || !cuData.data) throw new Error('Sin empresa asignada');
  return cuData.data.companyId;
}

// ── Crear un blast ───────────────────────────────────────────────────────

export async function createEmailBlast(input: CreateEmailBlastInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');
  const companyId = await getCompanyId();

  // Verificar cuota de emails del plan
  const companyRes = await fetch(`${GATEWAY_URL}/api/crm/companies/${companyId}`);
  const companyData = await companyRes.json();
  const tier = companyData?.data?.subscriptionTier || 'free';

  const campaignQuota = await enforceQuota(companyId, 'campaigns', tier);
  if (!campaignQuota.allowed) {
    throw new Error(
      `Límite de campañas alcanzado para el plan ${tier.toUpperCase()}. ` +
      `Límite: ${campaignQuota.limit}. Mejora tu plan para continuar.`
    );
  }

  const emailQuota = await enforceQuota(companyId, 'emails_per_month', tier);
  if (!emailQuota.allowed) {
    throw new Error(
      `Límite de emails mensuales alcanzado (${emailQuota.limit.toLocaleString()} emails/${tier} plan). ` +
      `El contador se resetea el 1ro del próximo mes.`
    );
  }

  const res = await gw('/api/email-blast', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      companyId,
      createdById: session.user.id
    })
  });

  return res?.blast || res;
}

// ── Obtener lista de blasts de la empresa ─────────────────────────────────

export async function getEmailBlasts() {
  try {
    const companyId = await getCompanyId();
    const res = await gw(`/api/email-blast?companyId=${companyId}`);
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
  const companyId = await getCompanyId();
  try {
    await gw(`/api/email-blast/${blastId}/send`, {
      method: 'POST',
      body: JSON.stringify({ companyId })
    });
    return { queued: true, message: 'La campaña ha sido encolada para su envío.' };
  } catch (error: any) {
    throw new Error(error.message || 'Error al enviar la campaña');
  }
}

// ── Reintentar envío a fallidos / pendientes ──────────────────────────────

export async function retryFailedEmailBlast(blastId: string) {
  const companyId = await getCompanyId();
  try {
    await gw(`/api/email-blast/${blastId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ companyId })
    });
    return { queued: true, message: 'Contactos reencolados para reintento.' };
  } catch (error: any) {
    throw new Error(error.message || 'Error al reintentar la campaña');
  }
}

// ── Estadísticas de un blast ──────────────────────────────────────────────

export async function getEmailBlastStats(blastId: string) {
  const companyId = await getCompanyId();
  try {
    const blast = await gw(`/api/email-blast/${blastId}?companyId=${companyId}`);
    return blast;
  } catch (error: any) {
    throw new Error(error.message || 'Error al obtener estadísticas');
  }
}

// ── Eliminar un blast ─────────────────────────────────────────────────────

export async function deleteEmailBlast(blastId: string) {
  const companyId = await getCompanyId();
  try {
    await gw(`/api/email-blast/${blastId}?companyId=${companyId}`, {
      method: 'DELETE'
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Error al eliminar campaña');
  }
}

export async function deleteEmailBlasts(blastIds: string[]) {
  const companyId = await getCompanyId();
  try {
    await gw('/api/email-blast/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ blastIds, companyId })
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Error al eliminar campañas');
  }
}

// ── Clonar un blast ───────────────────────────────────────────────────────

export async function cloneEmailBlast(blastId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');
  const companyId = await getCompanyId();

  try {
    const clone = await gw(`/api/email-blast/${blastId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ companyId, userId: session.user.id })
    });
    return clone;
  } catch (error: any) {
    throw new Error(error.message || 'Error al clonar campaña');
  }
}

// ── Enviar email de prueba ────────────────────────────────────────────────

export async function sendTestEmail(subject: string, html: string, toEmail: string) {
  try {
    const res = await gw('/api/email-blast/test', {
      method: 'POST',
      body: JSON.stringify({ subject, html, toEmail })
    });
    return res;
  } catch (error: any) {
    throw new Error(error.message || 'Error al enviar email de prueba');
  }
}
