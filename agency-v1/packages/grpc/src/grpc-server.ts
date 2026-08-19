import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import * as fs from "fs";

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
    const proto = grpc.loadPackageDefinition(packageDefinition) as Record<string, any>;
    const service = proto[packageName][serviceClass].service;
    this.server.addService(service, implementation);
    return this;
  }

  public start(port: number): Promise<string> {
    const bindAddress = `0.0.0.0:${port}`;
    return new Promise((resolve, reject) => {
      let credentials = grpc.ServerCredentials.createInsecure();

      const caPath = process.env.GRPC_SSL_CA_CERT_PATH || "/certs/ca.pem";
      const certPath = process.env.GRPC_SSL_SERVER_CERT_PATH || "/certs/server.pem";
      const keyPath = process.env.GRPC_SSL_SERVER_KEY_PATH || "/certs/server.key";

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        try {
          const rootCert = fs.existsSync(caPath) ? fs.readFileSync(caPath) : null;
          const keyPairs = [{
            private_key: fs.readFileSync(keyPath),
            cert_chain: fs.readFileSync(certPath)
          }];
          credentials = grpc.ServerCredentials.createSsl(
            rootCert,
            keyPairs,
            rootCert !== null // Enforce client certificate validation (mTLS) if root CA is provided
          );
          console.log(`[gRPC Server] SSL/mTLS enabled for bindAddress: ${bindAddress}`);
        } catch (err: any) {
          console.error(`[gRPC Server] SSL/mTLS init failed: ${err.message}. Falling back to insecure.`);
        }
      }

      this.server.bindAsync(bindAddress, credentials, (err, portBound) => {
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
