/**
 * Project Service — Kanban & Project Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4018 (internal)
 */
export declare const authGrpcClient: {
    call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
    rawClient: any;
    circuitBreaker: import("@agency/grpc").CircuitBreaker;
};
declare const _default: any;
export default _default;
