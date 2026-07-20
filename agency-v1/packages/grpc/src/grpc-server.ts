import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export class GrpcServerHelper {
  private server: grpc.Server;

  constructor() {
    this.server = new grpc.Server();
  }

  public addService(
    protoPath: string,
    packageName: string,
    serviceClass: string,
    implementation: Record<string, grpc.handleUnaryCall<any, any>>
  ): this {
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto = grpc.loadPackageDefinition(packageDefinition);
    const service = proto[packageName][serviceClass].service;
    this.server.addService(service, implementation);
    return this;
  }

  public start(port: number): Promise<string> {
    const bindAddress = `0.0.0.0:${port}`;
    return new Promise((resolve, reject) => {
      this.server.bindAsync(bindAddress, grpc.ServerCredentials.createInsecure(), (err, portBound) => {
        if (err) return reject(err);
        console.log(`[gRPC Server] High-speed gRPC server listening on ${bindAddress}`);
        resolve(`0.0.0.0:${portBound}`);
      });
    });
  }

  public async forceShutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.server.forceShutdown();
      resolve();
    });
  }
}
