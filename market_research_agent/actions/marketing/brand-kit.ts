'use server';

import { db as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const p = prisma as any; // BrandKit is in schema but client needs regen

export interface BrandKitData {
    name?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    fontFamily?: string;
    toneOfVoice?: string;
    brandValues?: string[];
    targetAudience?: string;
}

async function getCompanyId(userId: string) {
    const cu = await prisma.companyUser.findFirst({ where: { userId }, select: { companyId: true } });
    if (!cu) throw new Error('Company not found');
    return cu.companyId;
}

// ─── GET (or create default) ──────────────────────────────────────────────────
export async function getBrandKit() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const companyId = await getCompanyId(session.user.id);

    let kit = await p.brandKit.findUnique({ where: { companyId } });
    if (!kit) {
        kit = await p.brandKit.create({ data: { companyId } });
    }
    return kit as BrandKitData & { id: string; companyId: string };
}

// ─── UPSERT ───────────────────────────────────────────────────────────────────
export async function saveBrandKit(data: BrandKitData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    const companyId = await getCompanyId(session.user.id);

    const kit = await p.brandKit.upsert({
        where: { companyId },
        create: { companyId, ...data },
        update: data,
    });

    revalidatePath('/dashboard/admin/marketing/creative-studio');
    return { success: true, kit };
}
