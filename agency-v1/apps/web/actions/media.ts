'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const cu = await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  return cu?.companyId ?? null;
}

export interface MediaAsset {
  id: string;
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  sizeBytes: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  resolution: string | null;
  tags: string[];
  createdAt: Date;
}

export async function getMediaAssets(type?: string): Promise<MediaAsset[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const companyId = await getCompanyId();
  if (!companyId) return [];

  const assets = await prisma.mediaAsset.findMany({
    where: { companyId, ...(type ? { type } : {}) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, originalName: true, url: true,
      mimeType: true, type: true, sizeBytes: true, duration: true,
      width: true, height: true, fps: true, resolution: true,
      tags: true, createdAt: true,
    },
  });

  return assets as MediaAsset[];
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;
  const asset = await prisma.mediaAsset.findFirst({ where: { id, companyId } });
  return asset as MediaAsset | null;
}

export async function deleteMediaAsset(id: string): Promise<{ success: boolean }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const asset = await prisma.mediaAsset.findFirst({ where: { id, companyId } });
  if (!asset) throw new Error('Asset not found');

  // Eliminar archivo físico del VPS
  try {
    // URL: /api/serve/uploads/{companyId}/{type}/{file}
    const urlPath = asset.url.replace('/api/serve/', '');
    const filePath = join(process.cwd(), 'public', urlPath);
    await unlink(filePath);
  } catch {
    // Si el archivo ya no existe en disco, continuar
  }

  await prisma.mediaAsset.delete({ where: { id } });
  return { success: true };
}

export async function updateMediaAssetTags(id: string, tags: string[]): Promise<MediaAsset> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');
  const asset = await prisma.mediaAsset.update({ where: { id }, data: { tags } });
  return asset as MediaAsset;
}

export async function getMediaStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  totalSizeBytes: number;
}> {
  const companyId = await getCompanyId();
  if (!companyId) return { total: 0, byType: {}, totalSizeBytes: 0 };

  const assets = await prisma.mediaAsset.findMany({
    where: { companyId },
    select: { type: true, sizeBytes: true },
  });

  const byType: Record<string, number> = {};
  let totalSizeBytes = 0;

  for (const a of assets) {
    byType[a.type] = (byType[a.type] ?? 0) + 1;
    totalSizeBytes += a.sizeBytes;
  }

  return { total: assets.length, byType, totalSizeBytes };
}
