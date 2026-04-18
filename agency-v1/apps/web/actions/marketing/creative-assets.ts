'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface GenerateImageParams {
    campaignId?: string;
    prompt: string;
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:5' | '1.91:1';
    platform: string;
    style?: string;
    brandColors?: string[];
    brandName?: string;
}

export interface GenerateVideoParams {
    campaignId?: string;
    script?: string;
    referenceImageUrl?: string;
    duration?: 6 | 10 | 15;
    aspectRatio?: '9:16' | '16:9' | '1:1';
    platform?: string;
}

export interface GenerateCopyParams {
    platform: string;
    product: string;
    objective?: string;
    tone?: string;
    audience?: string;
    brandName?: string;
    campaignId?: string;
}

export interface OverlayConfig {
    type: 'logo' | 'text' | 'cta' | 'legal';
    content: string;
    x: number;
    y: number;
    width?: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
}

// ─── IMAGE GENERATION ────────────────────────────────────────────────────────

export async function generateImageAsset(params: GenerateImageParams) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/creative/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Image generation failed');
    }

    return res.json() as Promise<{ success: boolean; url: string; assetId?: string; dimensions: { width: number; height: number }; aspectRatio: string }>;
}

// ─── VIDEO GENERATION ────────────────────────────────────────────────────────

export async function generateVideoAsset(params: GenerateVideoParams) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/creative/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    const data = await res.json() as Record<string, unknown>;
    return data;
}

// ─── COPY GENERATION ─────────────────────────────────────────────────────────

export async function generateCopyForPlatform(params: GenerateCopyParams) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/creative/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error ?? 'Copy generation failed');
    }

    return res.json() as Promise<{ success: boolean; platform: string; copy: Record<string, unknown>; variations: Record<string, unknown>[] }>;
}

// ─── MANUAL UPLOAD ────────────────────────────────────────────────────────────

export async function uploadManualAsset(formData: FormData, campaignId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) throw new Error('Company not found');

    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error(`File too large. Max ${file.type.startsWith('video/') ? '50MB' : '5MB'}`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `manual-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
    });

    const assetType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';

    const asset = await prisma.campaignAsset.create({
        data: {
            campaignId,
            companyId: companyUser.companyId,
            type: assetType,
            url: blob.url,
            mimeType: file.type,
            name: file.name,
        },
    });

    revalidatePath(`/dashboard/admin/marketing/creative-studio`);
    return { success: true, assetId: asset.id, url: blob.url };
}

// ─── GET COMPANY ASSETS ───────────────────────────────────────────────────────

export async function getCompanyAssets(campaignId?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) throw new Error('Company not found');

    return prisma.campaignAsset.findMany({
        where: {
            companyId: companyUser.companyId,
            ...(campaignId ? { campaignId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

// ─── LINK ASSET TO A/B TEST ──────────────────────────────────────────────────

export async function linkAssetToABTest(assetId: string, abTestId: string, weight: number = 50) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const variant = await prisma.aBTestVariant.create({
        data: {
            abTestId,
            assetId,
            name: `Variant ${Date.now()}`,
            weight,
        },
    });

    return { success: true, variantId: variant.id };
}

// ─── DELETE ASSET ─────────────────────────────────────────────────────────────

export async function deleteAsset(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await prisma.campaignAsset.deleteMany({
        where: { id: assetId },
    });

    revalidatePath('/dashboard/admin/marketing/creative-studio');
    return { success: true };
}
