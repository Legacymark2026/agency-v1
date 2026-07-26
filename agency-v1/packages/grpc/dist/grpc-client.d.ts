import { CircuitBreaker, CircuitBreakerOptions } from "./circuit-breaker";
export declare class GrpcClientHelper {
    private static clientCache;
    private static breakers;
    /**
     * Load a proto file and return the package definition
     */
    static loadProto(protoPath: string): any;
    /**
     * Create or retrieve a gRPC client with built-in CircuitBreaker protection
     */
    static getClient<T = any>(serviceName: string, protoPath: string, packageName: string, serviceClass: string, targetAddress: string, breakerOptions?: CircuitBreakerOptions): {
        call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
        rawClient: any;
        circuitBreaker: CircuitBreaker;
    };
}
