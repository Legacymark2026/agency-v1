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
      const isDegraded = [502, 503, 504].includes(res.status);
      if (isDegraded && attempt < retries) {
        await new Promise((r) => setTimeout(r, Math.min(600 * attempt, 1500)));
        continue;
      }
      const detailMsg = err.reason || err.error || err.message || res.statusText || `Gateway error ${res.status}`;
      throw new Error(detailMsg);
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, Math.min(600 * attempt, 1500)));
    }
  }
}

async function getCompanyId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');

  try {
    const cuRes = await fetch(`${GATEWAY_URL}/api/crm/users/${session.user.id}/company`);
    if (cuRes.ok) {
      const cuData = await cuRes.json();
      if (cuData?.data?.companyId) return cuData.data.companyId;
    }
  } catch (e) {
    console.warn('[getCompanyId] Gateway lookup notice:', e);
  }
  return 'default';
}

// ── 1. Analytics Dashboard ───────────────────────────────────────────────────
export async function getGlobalAnalyticsDashboard() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/analytics/dashboard?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCampaignDetailedMetrics(blastId: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/analytics/campaign/${blastId}?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 2. Real-time Email Validation ───────────────────────────────────────────
export async function validateEmailAddress(email: string) {
  try {
    return await gw('/api/email-validation/validate', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function validateEmailBatchList(emails: string[]) {
  try {
    return await gw('/api/email-validation/validate-batch', {
      method: 'POST',
      body: JSON.stringify({ emails })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 3. Domain Reputation & Deliverability ────────────────────────────────────
export async function getDomainReputation(domain: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/domain-reputation/full-report?domain=${encodeURIComponent(domain)}&companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSenderHealthScore() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/domain-reputation/sender-score?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 4. Drip Sequences (Automations) ──────────────────────────────────────────
export async function getDripSequences() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/sequences?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createDripSequence(name: string, trigger: string, steps: any[]) {
  try {
    const companyId = await getCompanyId();
    return await gw('/api/sequences', {
      method: 'POST',
      body: JSON.stringify({ companyId, name, trigger, steps })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 5. Dynamic Audience Segmentation ────────────────────────────────────────
export async function getAudienceSegments() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/segments?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createAudienceSegment(name: string, rules: any[]) {
  try {
    const companyId = await getCompanyId();
    return await gw('/api/segments', {
      method: 'POST',
      body: JSON.stringify({ companyId, name, rules })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 6. Template Gallery ──────────────────────────────────────────────────────
export async function getTemplateGallery(category?: string) {
  try {
    const companyId = await getCompanyId();
    const query = category ? `&category=${encodeURIComponent(category)}` : '';
    return await gw(`/api/templates?companyId=${companyId}${query}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function cloneGalleryTemplate(templateId: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/templates/${templateId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ companyId })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 7. Webhook Integrations ─────────────────────────────────────────────────
export async function getWebhookIntegrations() {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/integrations/webhooks?companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function registerWebhookIntegration(url: string, events: string[], secret?: string) {
  try {
    const companyId = await getCompanyId();
    return await gw('/api/integrations/webhooks', {
      method: 'POST',
      body: JSON.stringify({ companyId, url, events, secret })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testWebhookIntegration(webhookId: string) {
  try {
    return await gw(`/api/integrations/webhooks/${webhookId}/test`, {
      method: 'POST'
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 8. Compliance & GDPR ─────────────────────────────────────────────────────
export async function getGdprAuditReport(email: string) {
  try {
    const companyId = await getCompanyId();
    return await gw(`/api/compliance/gdpr-report?email=${encodeURIComponent(email)}&companyId=${companyId}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
