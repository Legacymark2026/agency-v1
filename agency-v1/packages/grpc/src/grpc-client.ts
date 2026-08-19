import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as fs from "fs";
import { CircuitBreaker, CircuitBreakerOptions } from "./circuit-breaker";

export class GrpcClientHelper {
  private static clientCache: Map<string, any> = new Map();
  private static breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Load a proto file and return the package definition
   */
  public static loadProto(protoPath: string): any {
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    return grpc.loadPackageDefinition(packageDefinition);
  }

  /**
   * Create or retrieve a gRPC client with built-in CircuitBreaker protection
   */
  public static getClient<T = any>(
    serviceName: string,
    protoPath: string,
    packageName: string,
    serviceClass: string,
    targetAddress: string,
    breakerOptions?: CircuitBreakerOptions
  ): {
    call: <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>) => Promise<Res>;
    rawClient: any;
    circuitBreaker: CircuitBreaker;
  } {
    const cacheKey = `${serviceName}@${targetAddress}`;

    if (!this.clientCache.has(cacheKey)) {
      const proto = this.loadProto(protoPath) as Record<string, any>;
      const ServiceCtor = proto[packageName][serviceClass];

      const caPath = process.env.GRPC_SSL_CA_CERT_PATH || "/certs/ca.pem";
      const clientCertPath = process.env.GRPC_SSL_CLIENT_CERT_PATH || "/certs/client.pem";
      const clientKeyPath = process.env.GRPC_SSL_CLIENT_KEY_PATH || "/certs/client.key";

      let credentials = grpc.credentials.createInsecure();

      if (fs.existsSync(clientCertPath) && fs.existsSync(clientKeyPath)) {
        try {
          const rootCerts = fs.existsSync(caPath) ? fs.readFileSync(caPath) : null;
          const privateKey = fs.readFileSync(clientKeyPath);
          const certChain = fs.readFileSync(clientCertPath);
          credentials = grpc.credentials.createSsl(
            rootCerts,
            privateKey,
            certChain
          );
          console.log(`[gRPC Client] SSL/mTLS enabled for client target: ${targetAddress}`);
        } catch (err: any) {
          console.error(`[gRPC Client] SSL/mTLS client init failed: ${err.message}. Falling back to insecure.`);
        }
      }

      const client = new ServiceCtor(
        targetAddress,
        credentials
      );
      this.clientCache.set(cacheKey, client);
    }

    if (!this.breakers.has(cacheKey)) {
      this.breakers.set(cacheKey, new CircuitBreaker(serviceName, breakerOptions));
    }

    const rawClient = this.clientCache.get(cacheKey);
    const breaker = this.breakers.get(cacheKey)!;

    const call = <Req, Res>(methodName: string, req: Req, fallback?: () => Res | Promise<Res>): Promise<Res> => {
      return breaker.execute(
        () =>
          new Promise<Res>((resolve, reject) => {
            if (typeof rawClient[methodName] !== "function") {
              return reject(new Error(`Method ${methodName} not found on gRPC client ${serviceClass}`));
            }
            rawClient[methodName](req, (err: any, response: Res) => {
              if (err) return reject(err);
              resolve(response);
            });
          }),
        fallback
      );
    };

    return { call, rawClient, circuitBreaker: breaker };
  }
}
