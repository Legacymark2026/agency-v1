'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchCustomFields() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return null;

        // Fetching "Deal" or "Lead" fields specifically, or all custom definitions for this company
        const definitions = await prisma.customObjectDefinition.findMany({
            where: { companyId: companyUser.companyId },
            include: { fields: true }
        });

        // For simplicity, we just return all fields flattened for the builder UI
        const allFields = definitions.flatMap(def => def.fields.map(f => ({
            id: f.id,
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required
        })));

        return allFields;
    } catch (error) {
        return null;
    }
}

export async function updateCustomFields(fields: any[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });

        if (!companyUser) return { success: false, error: 'No company found' };

        // Ensure a base definition exists to attach fields to
        let definition = await prisma.customObjectDefinition.findFirst({
            where: { companyId: companyUser.companyId, name: 'lead' }
        });

        if (!definition) {
            definition = await prisma.customObjectDefinition.create({
                data: {
                    companyId: companyUser.companyId,
                    name: 'lead',
                    label: 'Lead Form Data'
                }
            });
        }

        // Delete existing fields attached to this definition
        await prisma.customObjectField.deleteMany({
            where: { definitionId: definition.id }
        });

        // Create the new fields
        if (fields.length > 0) {
            await prisma.customObjectField.createMany({
                data: fields.map(f => ({
                    definitionId: definition.id,
                    name: f.name,
                    label: f.name, // Using name as label for simplicity
                    type: f.type,
                    required: f.required || false
                }))
            });
        }

        revalidatePath('/dashboard/settings/crm');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update fields' };
    }
}

export async function updateSlaAlerts(settings: { active: boolean; responseTime: number; escalationTime: number }) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id },
            include: { company: true }
        });

        if (!companyUser?.company) return { success: false, error: 'No company found' };

        // We combine the SLA settings into the defaultCompanySettings json payload
        const currentSettings = (companyUser.company.defaultCompanySettings as any) || {};

        await prisma.company.update({
            where: { id: companyUser.companyId },
            data: {
                defaultCompanySettings: {
                    ...currentSettings,
                    sla: settings
                }
            }
        });

        revalidatePath('/dashboard/settings/crm');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to update SLA settings' };
    }
}
