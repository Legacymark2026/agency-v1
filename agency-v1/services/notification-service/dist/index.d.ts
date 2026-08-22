/**
 * Notification Service — Enterprise Notification & Delivery Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification hub for the entire LegacyMark platform.
 * Handles: In-App, Email (Resend), Push, SMS delivery channels.
 *
 * Features:
 * - Multi-channel dispatch (IN_APP, EMAIL, PUSH)
 * - User preference-aware delivery
 * - Event-driven architecture (subscribes to all platform events)
 * - Batch notification processing
 * - Read/unread state management
 * - Rate limiting per user per channel
 *
 * Port: 4016 (internal)
 */
export declare const authGrpcClient: {
    call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
    rawClient: any;
    circuitBreaker: import("@agency/grpc").CircuitBreaker;
};
declare const _default: any;
export default _default;
//# sourceMappingURL=index.d.ts.map