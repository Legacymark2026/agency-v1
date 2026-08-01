'use server';

import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}, retries = 8) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${GATEWAY_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      clearTimeout(timeout);

      if (res.ok) return res.json();

      const err = await res.json().catch(() => ({ error: res.statusText }));
      if ([502, 503, 504].includes(res.status) && attempt < retries) {
        await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 3000)));
        continue;
      }
      throw new Error(err.error || `Gateway error ${res.status}`);
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 3000)));
    }
  }
}

async function getCompanyId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('No autenticado');

    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    const cuData = await cuRes.json();
    if (!cuRes.ok || !cuData.data) throw new Error('Sin empresa asignada');
    return cuData.data.companyId;
}

export interface SaveTemplateInput {
    id?: string;
    name: string;
    subject: string;
    htmlBody: string;
    designJson?: any;
    category?: string;
}

// ── Guardar (o actualizar) Plantilla ────────────────────────
export async function saveEmailTemplate(input: SaveTemplateInput) {
    const companyId = await getCompanyId();

    try {
        if (input.id) {
            return await gw(`/api/email-templates/${input.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: input.name,
                    subject: input.subject,
                    htmlBody: input.htmlBody,
                    designJson: input.designJson,
                    category: input.category,
                    companyId
                })
            });
        }

        return await gw('/api/email-templates', {
            method: 'POST',
            body: JSON.stringify({
                name: input.name,
                subject: input.subject,
                htmlBody: input.htmlBody,
                designJson: input.designJson,
                category: input.category,
                companyId
            })
        });
    } catch (error: any) {
        throw new Error(error.message || 'Error al guardar la plantilla');
    }
}

// ── Listar Plantillas ────────────────────────────────────────
export async function getEmailTemplates() {
    const companyId = await getCompanyId();
    try {
        const templates = await gw(`/api/email-templates?companyId=${companyId}`);
        return templates;
    } catch (error) {
        console.error("Failed to get templates:", error);
        return [];
    }
}

// ── Obtener una Plantilla Específica ─────────────────────────
export async function getEmailTemplateData(id: string) {
    const companyId = await getCompanyId();
    try {
        const tpl = await gw(`/api/email-templates/${id}?companyId=${companyId}`);
        return tpl;
    } catch (error: any) {
        throw new Error(error.message || 'Plantilla no encontrada');
    }
}

// ── Eliminar Plantilla ───────────────────────────────────────
export async function deleteEmailTemplate(id: string) {
    const companyId = await getCompanyId();
    try {
        await gw(`/api/email-templates/${id}?companyId=${companyId}`, {
            method: 'DELETE'
        });
        return { success: true };
    } catch (error: any) {
        throw new Error(error.message || 'Error al eliminar la plantilla');
    }
}
