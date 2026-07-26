import * as grpc from "@grpc/grpc-js";
export declare class GrpcServerHelper {
    private server;
    constructor();
    addService(protoPath: string, packageName: string, serviceClass: string, implementation: Record<string, grpc.handleUnaryCall<any, any>>): this;
    start(port: number): Promise<string>;
    forceShutdown(): Promise<void>;
}
