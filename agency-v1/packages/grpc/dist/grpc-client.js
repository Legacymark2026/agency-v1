"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcClientHelper = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const fs = __importStar(require("fs"));
const circuit_breaker_1 = require("./circuit-breaker");
class GrpcClientHelper {
    static clientCache = new Map();
    static breakers = new Map();
    /**
     * Load a proto file and return the package definition
     */
    static loadProto(protoPath) {
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
    static getClient(serviceName, protoPath, packageName, serviceClass, targetAddress, breakerOptions) {
        const cacheKey = `${serviceName}@${targetAddress}`;
        if (!this.clientCache.has(cacheKey)) {
            const proto = this.loadProto(protoPath);
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
                    credentials = grpc.credentials.createSsl(rootCerts, privateKey, certChain);
                    console.log(`[gRPC Client] SSL/mTLS enabled for client target: ${targetAddress}`);
                }
                catch (err) {
                    console.error(`[gRPC Client] SSL/mTLS client init failed: ${err.message}. Falling back to insecure.`);
                }
            }
            const client = new ServiceCtor(targetAddress, credentials);
            this.clientCache.set(cacheKey, client);
        }
        if (!this.breakers.has(cacheKey)) {
            this.breakers.set(cacheKey, new circuit_breaker_1.CircuitBreaker(serviceName, breakerOptions));
        }
        const rawClient = this.clientCache.get(cacheKey);
        const breaker = this.breakers.get(cacheKey);
        const call = (methodName, req, fallback) => {
            return breaker.execute(() => new Promise((resolve, reject) => {
                if (typeof rawClient[methodName] !== "function") {
                    return reject(new Error(`Method ${methodName} not found on gRPC client ${serviceClass}`));
                }
                rawClient[methodName](req, (err, response) => {
                    if (err)
                        return reject(err);
                    resolve(response);
                });
            }), fallback);
        };
        return { call, rawClient, circuitBreaker: breaker };
    }
}
exports.GrpcClientHelper = GrpcClientHelper;
