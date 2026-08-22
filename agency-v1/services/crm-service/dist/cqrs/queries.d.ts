/**
 * services/crm-service/src/cqrs/queries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * CQRS — Query Side (Read Views & High-Speed Cache Projections)
 * Queries high-traffic read views from Redis cache projections with instant fallback.
 */
export interface GetLeadsQueryInput {
    companyId: string;
    status?: string;
    source?: string;
    page?: number;
    pageSize?: number;
}
export declare function executeGetLeadsQuery(input: GetLeadsQueryInput): Promise<any>;
export declare function executeGetPipelineQuery(companyId: string): Promise<any>;
