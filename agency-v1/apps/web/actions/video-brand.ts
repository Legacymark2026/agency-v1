'use server';

import { prisma as prismaDb } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
async function gw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || `Gateway error ${res.status}`); }
  return res.json();
}

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cu = await prismaDb.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  return cu?.companyId ?? null;
}

export interface BrandStyleInput {
  clientName: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  subtitlePreset?: any;
  preferences?: any;
}

export async function createOrUpdateBrandStyle(
  data: BrandStyleInput,
): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Company not found');

  const existing = await getBrandStyle();
  let brand;

  if (existing) {
    brand = await gw(`/api/video/brand/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        clientName: data.clientName,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        fontFamily: data.fontFamily,
        subtitlePreset: data.subtitlePreset,
        preferences: data.preferences,
      }),
    });
  } else {
    brand = await gw('/api/video/brand', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        clientName: data.clientName,
        primaryColor: data.primaryColor || '#6D28D9',
        secondaryColor: data.secondaryColor || '#FFFFFF',
        accentColor: data.accentColor || '#10B981',
        fontFamily: data.fontFamily || 'Inter',
        subtitlePreset: data.subtitlePreset || {
          size: 40,
          color: '#FFFFFF',
          shadow: true,
          animation: 'fade',
          position: 'bottom',
        },
        preferences: data.preferences || {},
      }),
    });
  }

  return { id: brand.id };
}

export async function getBrandStyle(): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    return await gw(`/api/video/brand?companyId=${companyId}`);
  } catch {
    return null;
  }
}

export async function learnBrandPreference(
  correction: {
    beforeStyle: any;
    afterStyle: any;
    context: string;
  },
): Promise<void> {
  const companyId = await getCompanyId();
  if (!companyId) return;

  const existing = await getBrandStyle();

  const currentPreferences = (existing?.preferences as any) || {};
  const corrections = currentPreferences.corrections || [];

  corrections.push({
    before: correction.beforeStyle,
    after: correction.afterStyle,
    context: correction.context,
    learnedAt: new Date().toISOString(),
  });

  const updatedPreferences = {
    ...currentPreferences,
    corrections: corrections.slice(-50),
    lastLearnedAt: new Date().toISOString(),
  };

  if (existing) {
    await gw(`/api/video/brand/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        preferences: updatedPreferences,
      }),
    });
  } else {
    await gw('/api/video/brand', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        clientName: 'Default',
        subtitlePreset: correction.afterStyle,
        preferences: updatedPreferences,
      }),
    });
  }
}

export async function getBrandStyleForAgent(): Promise<{
  colors: { primary: string; secondary: string; accent: string };
  font: string;
  subtitlePreset: any;
  preferences: any;
} | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const style = await getBrandStyle();
  if (!style) return null;

  return {
    colors: {
      primary: style.primaryColor,
      secondary: style.secondaryColor,
      accent: style.accentColor,
    },
    font: style.fontFamily,
    subtitlePreset: style.subtitlePreset,
    preferences: style.preferences,
  };
}

export async function searchSimilarBrandStyles(
  targetEmbedding: number[],
  limit: number = 5,
): Promise<any[]> {
  const companyId = await getCompanyId();
  if (!companyId) return [];

  try {
    const res = await gw('/api/video/brand/similar', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        targetEmbedding,
        limit,
      }),
    });
    return res.results || [];
  } catch {
    return [];
  }
}
