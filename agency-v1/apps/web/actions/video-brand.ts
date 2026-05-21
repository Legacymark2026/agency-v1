'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cu = await prisma.companyUser.findFirst({
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

  const style = await prisma.brandStyle.upsert({
    where: { companyId },
    update: {
      clientName: data.clientName,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      fontFamily: data.fontFamily,
      subtitlePreset: data.subtitlePreset,
      preferences: data.preferences,
    },
    create: {
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
    },
  });

  return { id: style.id };
}

export async function getBrandStyle(): Promise<any | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  return prisma.brandStyle.findUnique({
    where: { companyId },
  });
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

  const existing = await prisma.brandStyle.findUnique({
    where: { companyId },
  });

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

  await prisma.brandStyle.upsert({
    where: { companyId },
    update: {
      preferences: updatedPreferences,
    },
    create: {
      companyId,
      clientName: 'Default',
      subtitlePreset: correction.afterStyle,
      preferences: updatedPreferences,
    },
  });
}

export async function getBrandStyleForAgent(): Promise<{
  colors: { primary: string; secondary: string; accent: string };
  font: string;
  subtitlePreset: any;
  preferences: any;
} | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  const style = await prisma.brandStyle.findUnique({
    where: { companyId },
    select: {
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontFamily: true,
      subtitlePreset: true,
      preferences: true,
    },
  });

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

  const embeddingStr = JSON.stringify(targetEmbedding);

  const results = await prisma.$queryRaw`
    SELECT id, client_name, primary_color, secondary_color, font_family,
           subtitle_preset, preferences,
           style_embedding <=> ${embeddingStr}::vector AS similarity
    FROM tbl_brand_styles
    WHERE style_embedding IS NOT NULL
      AND company_id != ${companyId}
    ORDER BY similarity ASC
    LIMIT ${limit}
  `;

  return results as any[];
}
