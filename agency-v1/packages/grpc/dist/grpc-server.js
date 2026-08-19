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
exports.GrpcServerHelper = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const fs = __importStar(require("fs"));
class GrpcServerHelper {
    server;
    constructor() {
        this.server = new grpc.Server();
    }
    addService(protoPath, packageName, serviceClass, implementation) {
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
    start(port) {
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
                    credentials = grpc.ServerCredentials.createSsl(rootCert, keyPairs, rootCert !== null // Enforce client certificate validation (mTLS) if root CA is provided
                    );
                    console.log(`[gRPC Server] SSL/mTLS enabled for bindAddress: ${bindAddress}`);
                }
                catch (err) {
                    console.error(`[gRPC Server] SSL/mTLS init failed: ${err.message}. Falling back to insecure.`);
                }
            }
            this.server.bindAsync(bindAddress, credentials, (err, portBound) => {
                if (err)
                    return reject(err);
                console.log(`[gRPC Server] High-speed gRPC server listening on ${bindAddress}`);
                resolve(`0.0.0.0:${portBound}`);
            });
        });
    }
    async forceShutdown() {
        return new Promise((resolve) => {
            this.server.forceShutdown();
            resolve();
        });
    }
}
exports.GrpcServerHelper = GrpcServerHelper;
