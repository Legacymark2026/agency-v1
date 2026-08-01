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

// ── Listas ─────────────────────────────────────────────────────────────────
export async function getMailingLists() {
    try {
        const companyId = await getCompanyId();
        const lists = await gw(`/api/mailing-lists?companyId=${companyId}`);
        return lists;
    } catch (err: any) {
        return [];
    }
}

export async function createMailingList(name: string, description?: string) {
    try {
        const companyId = await getCompanyId();
        const data = await gw('/api/mailing-lists', {
            method: 'POST',
            body: JSON.stringify({ name, description, companyId })
        });
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido' };
    }
}

export async function getListSubscribers(listId: string) {
    try {
        const companyId = await getCompanyId();
        const subscribers = await gw(`/api/mailing-lists/${listId}/subscribers?companyId=${companyId}`);
        return subscribers;
    } catch {
        return [];
    }
}

export async function addSubscribersToList(listId: string, subscribers: Array<{ email: string; name?: string; customFields?: Record<string, any> }>) {
    try {
        const companyId = await getCompanyId();
        const data = await gw(`/api/mailing-lists/${listId}/subscribers`, {
            method: 'POST',
            body: JSON.stringify({ companyId, subscribers })
        });
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || 'Error al guardar contactos en la lista' };
    }
}

// ── Supresión ─────────────────────────────────────────────────────────────
export async function getSuppressionList() {
    try {
        const companyId = await getCompanyId();
        const suppressionList = await gw(`/api/suppression-lists?companyId=${companyId}`);
        return suppressionList;
    } catch (err: any) {
        return [];
    }
}

export async function addSuppression(email: string, reason: string = 'UNSUBSCRIBED') {
    try {
        const companyId = await getCompanyId();
        const data = await gw('/api/suppression-lists', {
            method: 'POST',
            body: JSON.stringify({ companyId, email, reason })
        });
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido' };
    }
}
