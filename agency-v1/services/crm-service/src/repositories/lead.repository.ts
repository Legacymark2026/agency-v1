/**
 * services/crm-service/src/repositories/lead.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM Lead Repository Implementation
 */

import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "crm-repository");

export interface LeadEntity {
  id: string;
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: string | null;
  score?: number | null;
  assignedUserId?: string | null;
  convertedToDealId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadRepository {
  findMany(params: {
    where: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<LeadEntity[]>;
  count(where: any): Promise<number>;
  create(data: any): Promise<LeadEntity>;
  update(id: string, data: any): Promise<LeadEntity>;
  groupBySource(companyId: string): Promise<any[]>;
}

export class PrismaLeadRepository implements ILeadRepository {
  async findMany(params: {
    where: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<LeadEntity[]> {
    try {
      const leads = await prisma.lead.findMany(params);
      return leads as LeadEntity[];
    } catch (err: any) {
      console.error(`[PrismaLeadRepository] findMany error: ${err.message}`);
      throw err;
    }
  }

  async count(where: any): Promise<number> {
    try {
      return await prisma.lead.count({ where });
    } catch (err: any) {
      console.error(`[PrismaLeadRepository] count error: ${err.message}`);
      throw err;
    }
  }

  async create(data: any): Promise<LeadEntity> {
    try {
      const lead = await prisma.lead.create({ data });
      
      // Dual-Write/CDC synchronization
      await eventBus.publish("lead.created", {
        companyId: lead.companyId,
        name: lead.name,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        source: lead.source || undefined,
        status: lead.status || undefined,
      }).catch((e) => console.warn("[LeadRepository] Sync publish error:", e.message));

      return lead as LeadEntity;
    } catch (err: any) {
      console.error(`[PrismaLeadRepository] create error: ${err.message}`);
      throw err;
    }
  }

  async update(id: string, data: any): Promise<LeadEntity> {
    try {
      const lead = await prisma.lead.update({
        where: { id },
        data,
      });
      return lead as LeadEntity;
    } catch (err: any) {
      console.error(`[PrismaLeadRepository] update error: ${err.message}`);
      throw err;
    }
  }

  async groupBySource(companyId: string): Promise<any[]> {
    try {
      return await prisma.lead.groupBy({
        by: ["source"],
        where: { companyId },
        _count: { id: true },
        _avg: { score: true },
      });
    } catch (err: any) {
      console.error(`[PrismaLeadRepository] groupBySource error: ${err.message}`);
      throw err;
    }
  }
}

export const leadRepository = new PrismaLeadRepository();
