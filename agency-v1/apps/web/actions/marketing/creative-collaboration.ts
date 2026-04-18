"use server";

import { db as prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ─── ANNOTATIONS (Figma-style comments) ─────────────────────────────

export async function addAnnotation(params: {
    assetId: string;
    content: string;
    xPercent: number;
    yPercent: number;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const annotation = await prisma.assetAnnotation.create({
        data: {
            assetId: params.assetId,
            authorId: session.user.id,
            content: params.content,
            xPercent: params.xPercent,
            yPercent: params.yPercent,
        },
        include: { author: { select: { name: true, image: true } } },
    });

    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true, annotation };
}

export async function resolveAnnotation(annotationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.assetAnnotation.update({
        where: { id: annotationId },
        data: { status: "RESOLVED" },
    });

    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}

export async function deleteAnnotation(annotationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.assetAnnotation.delete({ where: { id: annotationId } });
    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}

export async function getAnnotations(assetId: string) {
    const annotations = await prisma.assetAnnotation.findMany({
        where: { assetId },
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
    });
    return annotations;
}

// ─── COLLECTIONS (Folders) ───────────────────────────────────────────

export async function createCollection(name: string, description?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) return { success: false, error: "Company not found" };

    const collection = await prisma.assetCollection.create({
        data: {
            name,
            description,
            companyId: companyUser.companyId,
            createdById: session.user.id,
        },
    });

    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true, collection };
}

export async function getCollections() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: session.user.id },
        select: { companyId: true },
    });
    if (!companyUser) return [];

    return prisma.assetCollection.findMany({
        where: { companyId: companyUser.companyId },
        include: {
            items: {
                include: { asset: { select: { id: true, url: true, name: true, type: true } } },
                orderBy: { order: "asc" },
                take: 6,
            },
            _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function addAssetToCollection(collectionId: string, assetId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Get max order in the collection
    const maxOrder = await prisma.assetCollectionItem.aggregate({
        where: { collectionId },
        _max: { order: true },
    });

    await prisma.assetCollectionItem.upsert({
        where: { collectionId_assetId: { collectionId, assetId } },
        create: { collectionId, assetId, order: (maxOrder._max.order ?? 0) + 1 },
        update: {},
    });

    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}

export async function removeAssetFromCollection(collectionId: string, assetId: string) {
    await prisma.assetCollectionItem.delete({
        where: { collectionId_assetId: { collectionId, assetId } },
    });
    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}

export async function deleteCollection(collectionId: string) {
    await prisma.assetCollection.delete({ where: { id: collectionId } });
    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}

// ─── VERSIONS (History) ──────────────────────────────────────────────

export async function saveAssetVersion(params: {
    assetId: string;
    url: string;
    prompt?: string;
    changeNote?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const lastVersion = await prisma.assetVersion.aggregate({
        where: { assetId: params.assetId },
        _max: { version: true },
    });

    const nextVersion = (lastVersion._max.version ?? 0) + 1;

    const version = await prisma.assetVersion.create({
        data: {
            assetId: params.assetId,
            version: nextVersion,
            url: params.url,
            prompt: params.prompt,
            changeNote: params.changeNote,
            createdById: session.user.id,
        },
        include: { createdBy: { select: { name: true, image: true } } },
    });

    return { success: true, version };
}

export async function getAssetVersions(assetId: string) {
    return prisma.assetVersion.findMany({
        where: { assetId },
        include: { createdBy: { select: { id: true, name: true, image: true } } },
        orderBy: { version: "desc" },
    });
}

export async function restoreAssetVersion(assetId: string, versionId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const versionRecord = await prisma.assetVersion.findUnique({ where: { id: versionId } });
    if (!versionRecord) return { success: false, error: "Version not found" };

    // Update the main asset URL to the restored version
    await prisma.campaignAsset.update({
        where: { id: assetId },
        data: { url: versionRecord.url },
    });

    // Save the restoration as a new version entry
    await saveAssetVersion({
        assetId,
        url: versionRecord.url,
        changeNote: `Restored to v${versionRecord.version}`,
    });

    revalidatePath("/dashboard/admin/marketing/creative-studio");
    return { success: true };
}
