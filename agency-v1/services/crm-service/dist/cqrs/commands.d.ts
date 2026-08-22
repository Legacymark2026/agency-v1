/**
 * services/crm-service/src/cqrs/commands.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Command Side (Write Operations & Event Sourcing)
 * Executes ACID mutations against PostgreSQL Primary and publishes events.
 */
export interface CreateLeadCommandInput {
    companyId: string;
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: string;
    score?: number;
    value?: number;
    customFields?: Record<string, unknown>;
}
export declare function executeCreateLeadCommand(input: CreateLeadCommandInput): Promise<any>;
export interface UpdateDealStageCommandInput {
    dealId: string;
    companyId: string;
    toStage: string;
    userId?: string;
}
export declare function executeUpdateDealStageCommand(input: UpdateDealStageCommandInput): Promise<any>;
