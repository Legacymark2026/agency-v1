import "@agency/observability/register";
export declare const authGrpcClient: {
    call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
    rawClient: any;
    circuitBreaker: import("@agency/grpc").CircuitBreaker;
};
