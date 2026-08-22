/**
 * services/crm-service/src/repositories/lead.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM Lead Repository Implementation
 */
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
export declare class PrismaLeadRepository implements ILeadRepository {
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
export declare const leadRepository: PrismaLeadRepository;
