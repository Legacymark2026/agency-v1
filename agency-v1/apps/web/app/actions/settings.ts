'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function updatePasswordPolicy(policy: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        // Get the user's primary company for simplicity in this demo context
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return { success: false, error: 'No company found' };

        await prisma.company.update({
            where: { id: companyUser.companyId },
            data: { passwordPolicy: policy }
        });

        revalidatePath('/dashboard/settings/security');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update password policy:', error);
        return { success: false, error: error.message || 'Failed to update' };
    }
}

export async function toggleTwoFactor(enabled: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        // Generate a mock secret if enabling (in a real app, you'd show a QR code first)
        const secret = enabled ? crypto.randomBytes(32).toString('hex') : null;

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                mfaEnabled: enabled,
                mfaSecret: secret
            }
        });

        revalidatePath('/dashboard/settings/security');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to toggle 2FA' };
    }
}

export async function generateBackupCodes() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const codes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-') || ''
        );

        await prisma.user.update({
            where: { id: session.user.id },
            data: { backupCodes: codes }
        });

        revalidatePath('/dashboard/settings/security');
        return { success: true, codes };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to generate codes' };
    }
}

export async function fetchSecuritySettings() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { mfaEnabled: true, backupCodes: true }
        });

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            include: { company: true }
        });

        return {
            mfaEnabled: user?.mfaEnabled || false,
            hasBackupCodes: Array.isArray(user?.backupCodes) && user!.backupCodes.length > 0,
            passwordPolicy: companyUser?.company?.passwordPolicy || {}
        };
    } catch (error) {
        return null;
    }
}

export async function requestDataExport() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        // Simulate an asynchronous queuing mechanism
        await new Promise(resolve => setTimeout(resolve, 800));

        // In a real application, you'd trigger a background job here (e.g. BullMQ, AWS SQS)
        return {
            success: true,
            message: "La exportación ha sido encolada. Recibirás un correo cuando el archivo .zip esté listo."
        };
    } catch (error: any) {
        return { success: false, error: error.message || 'Error scheduling export' };
    }
}

export async function deleteAccount() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return { success: false, error: 'User is not linked to a company' };

        // Real Authorization Check: Only block if they aren't owner/admin
        if (companyUser.roleName !== 'owner' && companyUser.roleName !== 'admin') {
            return {
                success: false,
                error: "La eliminación permanente de tu cuenta requiere autorización. No tienes los permisos necesarios."
            };
        }

        // Simulating the deletion (We don't actually want to delete the user for demo purposes)
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to process deletion request' };
    }
}

export async function updateCompanyDefaultSettings(settings: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return { success: false, error: 'No company found' };

        await prisma.company.update({
            where: { id: companyUser.companyId },
            data: { defaultCompanySettings: settings }
        });

        revalidatePath('/dashboard/settings/general');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to parse and update settings' };
    }
}

export async function fetchCompanySettings() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            include: { company: true }
        });

        if (!companyUser?.company) return null;

        return {
            logoUrl: companyUser.company.logoUrl,
            defaultSettings: companyUser.company.defaultCompanySettings || {},
            whiteLabeling: companyUser.company.whiteLabeling || {}
        };
    } catch (error) {
        return null;
    }
}

export async function updateWhiteLabeling(settings: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return { success: false, error: 'No company found' };

        await prisma.company.update({
            where: { id: companyUser.companyId },
            data: {
                logoUrl: settings.logoUrl,
                whiteLabeling: { primaryColor: settings.primaryColor }
            }
        });

        revalidatePath('/dashboard/settings/company');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update white labeling' };
    }
}
