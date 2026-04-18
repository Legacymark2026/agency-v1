/**
 * Leads Module - Server Actions
 */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { CreateLeadInput, UpdateLeadInput, LeadFilters } from '../types';
import { createLeadSchema, updateLeadSchema } from '../lib/validations';
import { calculateLeadScore } from '../lib/utils';

/**
 * Get all leads with filters
 */
export async function getLeads(filters?: LeadFilters) {
    try {
        const {
            status,
            source,
            priority,
            assignedToId,
            search,
            dateFrom,
            dateTo,
            limit = 50,
            offset = 0,
            orderBy = 'createdAt',
            order = 'desc',
        } = filters || {};

        const where: any = {};

        if (status) {
            where.status = Array.isArray(status) ? { in: status } : status;
        }
        if (source) {
            where.source = Array.isArray(source) ? { in: source } : source;
        }
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = assignedToId;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }

        const leads = await prisma.lead.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { [orderBy]: order },
        });

        const total = await prisma.lead.count({ where });

        return {
            success: true,
            leads,
            total,
        };
    } catch (error) {
        console.error('Error fetching leads:', error);
        return {
            success: false,
            error: 'Failed to fetch leads',
        };
    }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id },
        });

        if (!lead) {
            return {
                success: false,
                error: 'Lead not found',
            };
        }

        return {
            success: true,
            lead,
        };
    } catch (error) {
        console.error('Error fetching lead:', error);
        return {
            success: false,
            error: 'Failed to fetch lead',
        };
    }
}

/**
 * Create a new lead
 */
export async function createLead(data: CreateLeadInput) {
    try {
        const validData = createLeadSchema.parse(data);

        // Calculate initial lead score
        const score = calculateLeadScore({
            email: validData.email,
            phone: validData.phone,
            company: validData.company,
            website: validData.website,
            source: validData.source,
        });

        const lead = await prisma.lead.create({
            data: {
                name: validData.name,
                email: validData.email,
                phone: validData.phone,
                company: validData.company,
                jobTitle: validData.jobTitle,
                message: validData.message,
                source: validData.source,
                status: 'NEW',
                score,
                utmSource: validData.utmParams?.source,
                utmMedium: validData.utmParams?.medium,
                utmCampaign: validData.utmParams?.campaign,
                utmTerm: validData.utmParams?.term,
                utmContent: validData.utmParams?.content,
                companyId: '', // Placeholder — set properly in context
            },
        });

        revalidatePath('/dashboard/leads');

        return {
            success: true,
            lead,
        };
    } catch (error) {
        console.error('Error creating lead:', error);
        return {
            success: false,
            error: 'Failed to create lead',
        };
    }
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: UpdateLeadInput) {
    try {
        const validData = updateLeadSchema.parse(data);

        const lead = await prisma.lead.update({
            where: { id },
            data: validData,
        });

        revalidatePath('/dashboard/leads');

        return {
            success: true,
            lead,
        };
    } catch (error) {
        console.error('Error updating lead:', error);
        return {
            success: false,
            error: 'Failed to update lead',
        };
    }
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string) {
    try {
        await prisma.lead.delete({ where: { id } });

        revalidatePath('/dashboard/leads');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error deleting lead:', error);
        return {
            success: false,
            error: 'Failed to delete lead',
        };
    }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(id: string, status: string) {
    try {
        const updateData: any = { status };

        // Set timestamps based on status
        if (status === 'CONTACTED' && !updateData.contactedAt) {
            updateData.contactedAt = new Date();
        }
        if (status === 'CONVERTED') {
            updateData.convertedAt = new Date();
        }

        const lead = await prisma.lead.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/dashboard/leads');

        return {
            success: true,
            lead,
        };
    } catch (error) {
        console.error('Error updating lead status:', error);
        return {
            success: false,
            error: 'Failed to update lead status',
        };
    }
}

/**
 * Assign lead to user
 */
export async function assignLead(leadId: string, userId: string) {
    try {
        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: { assignedTo: userId },
        });

        revalidatePath('/dashboard/leads');

        return {
            success: true,
            lead,
        };
    } catch (error) {
        console.error('Error assigning lead:', error);
        return {
            success: false,
            error: 'Failed to assign lead',
        };
    }
}

/**
 * Get lead statistics
 */
export async function getLeadStats(companyId?: string) {
    try {
        const where: any = {};
        if (companyId) where.companyId = companyId;

        const [total, byStatus, avgScore] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            prisma.lead.aggregate({
                where,
                _avg: { score: true },
            }),
        ]);

        const stats = {
            total,
            new: byStatus.find((s: any) => s.status === 'NEW')?._count || 0,
            contacted: byStatus.find((s: any) => s.status === 'CONTACTED')?._count || 0,
            qualified: byStatus.find((s: any) => s.status === 'QUALIFIED')?._count || 0,
            converted: byStatus.find((s: any) => s.status === 'CONVERTED')?._count || 0,
            lost: byStatus.find((s: any) => s.status === 'LOST')?._count || 0,
            averageScore: avgScore._avg.score || 0,
        };

        return {
            success: true,
            stats,
        };
    } catch (error) {
        console.error('Error fetching lead stats:', error);
        return {
            success: false,
            error: 'Failed to fetch statistics',
        };
    }
}
