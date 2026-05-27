'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

  try {
    const assets = await gw(`/api/cms/media?companyId=${companyId}${type ? `&type=${type}` : ''}`);
    return assets as MediaAsset[];
  } catch (error) {
    console.error("Failed to get media assets:", error);
    return [];
  }
}

export async function getMediaAsset(id: string): Promise<MediaAsset | null> {
  const companyId = await getCompanyId();
  if (!companyId) return null;

  try {
    const asset = await gw(`/api/cms/media/${id}?companyId=${companyId}`);
    return asset as MediaAsset;
  } catch (error) {
    console.error("Failed to get media asset:", error);
    return null;
  }
}

export async function deleteMediaAsset(id: string): Promise<{ success: boolean }> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  const asset = await getMediaAsset(id);
  if (!asset) throw new Error('Asset not found');

  // Eliminar archivo físico del VPS
  try {
    const urlPath = asset.url.replace('/api/serve/', '');
    const filePath = join(process.cwd(), 'public', urlPath);
    await unlink(filePath);
  } catch {
    // Si el archivo ya no existe en disco, continuar
  }

  try {
    await gw(`/api/cms/media/${id}`, {
      method: 'DELETE'
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete media asset from DB:", error);
    return { success: false };
  }
}

export async function updateMediaAssetTags(id: string, tags: string[]): Promise<MediaAsset> {
  const companyId = await getCompanyId();
  if (!companyId) throw new Error('Unauthorized');

  try {
    const asset = await gw(`/api/cms/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ tags })
    });
    return asset as MediaAsset;
  } catch (error) {
    console.error("Failed to update media tags:", error);
    throw error;
  }
}

export async function getMediaStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  totalSizeBytes: number;
}> {
  const companyId = await getCompanyId();
  if (!companyId) return { total: 0, byType: {}, totalSizeBytes: 0 };

  try {
    const assets = await gw(`/api/cms/media-stats?companyId=${companyId}`);
    const byType: Record<string, number> = {};
    let totalSizeBytes = 0;

    for (const a of assets) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      totalSizeBytes += a.sizeBytes;
    }

    return { total: assets.length, byType, totalSizeBytes };
  } catch (error) {
    console.error("Failed to get media stats:", error);
    return { total: 0, byType: {}, totalSizeBytes: 0 };
  }
}
