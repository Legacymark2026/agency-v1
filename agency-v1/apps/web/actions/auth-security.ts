'use server';

import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';

async function gw(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    clearTimeout(timeout);
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `Error ${res.status}`);
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}

async function getUserId(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autenticado');
  return { id: session.user.id, email: session.user.email || 'usuario@legacymarksas.com' };
}

export async function generate2FASecret() {
  try {
    const { id, email } = await getUserId();
    return await gw('/api/v1/auth/2fa/generate', {
      method: 'POST',
      body: JSON.stringify({ userId: id, email })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function enable2FAWithToken(secret: string, token: string) {
  try {
    const { id } = await getUserId();
    return await gw('/api/v1/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ userId: id, secret, token })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function verify2FAToken(tokenOrBackupCode: string) {
  try {
    const { id } = await getUserId();
    return await gw('/api/v1/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ userId: id, tokenOrBackupCode })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function disable2FAForUser() {
  try {
    const { id } = await getUserId();
    return await gw('/api/v1/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ userId: id })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSecurityAuditLogs() {
  try {
    const { id } = await getUserId();
    return await gw(`/api/v1/auth/audit-logs?userId=${id}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function refreshSessionToken(refreshToken: string) {
  try {
    return await gw('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function revokeAllSessions() {
  try {
    const { id } = await getUserId();
    return await gw('/api/v1/auth/logout-all', {
      method: 'POST',
      body: JSON.stringify({ userId: id })
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getActiveSessions() {
  try {
    const { id } = await getUserId();
    return await gw(`/api/v1/auth/sessions?userId=${id}`);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
