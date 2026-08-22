/**
 * CRM Service — Customer Relationship Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles: Leads, Deals, Pipeline, Scoring, Sequences, Commissions
 * Port: 4002
 */
export declare const authGrpcClient: {
    call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
    rawClient: any;
    circuitBreaker: import("@agency/grpc").CircuitBreaker;
};
declare const _default: any;
export default _default;
