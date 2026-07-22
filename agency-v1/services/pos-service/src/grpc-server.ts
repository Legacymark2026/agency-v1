/**
 * gRPC Server Implementation for Isolated Catalog Microservice
 * Listens on Port 50051 for high-performance Protocol Buffers (catalog.proto) RPC calls.
 */
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { IsolatedCatalogRepository } from "./catalog-repository";

const PROTO_PATH = path.resolve(__dirname, "../proto/catalog.proto");

export class CatalogGRPCServer {
    private server: grpc.Server;
    private repository: IsolatedCatalogRepository;
    private port: number;

    constructor(repository: IsolatedCatalogRepository, port: number = 50051) {
        this.repository = repository;
        this.port = port;
        this.server = new grpc.Server();
        this.setupHandlers();
    }

    private setupHandlers() {
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        const catalogProto = protoDescriptor.catalog;

        this.server.addService(catalogProto.CatalogGRPCService.service, {
            GetProducts: async (call: any, callback: any) => {
                try {
                    const products = await this.repository.findAll({
                        category: call.request.category,
                        search: call.request.search,
                    });
                    callback(null, {
                        success: true,
                        company_id: call.request.company_id || "company_default_pos",
                        products: products.map(p => ({
                            id: p.id,
                            company_id: p.companyId,
                            sku: p.sku,
                            barcode: p.barcode,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            unit_price: p.unitPrice,
                            cost_price: p.costPrice,
                            wholesale_price: p.wholesalePrice,
                            tax_rate: p.taxRate,
                            stock: p.stock,
                            is_active: p.isActive,
                            image_url: p.imageUrl,
                            created_at: p.createdAt,
                            updated_at: p.updatedAt,
                        })),
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            GetProductById: async (call: any, callback: any) => {
                try {
                    const p = await this.repository.findByIdOrSku(call.request.id_or_sku);
                    if (!p) {
                        return callback(null, { success: false, error: "Producto no encontrado" });
                    }
                    callback(null, {
                        success: true,
                        product: {
                            id: p.id,
                            company_id: p.companyId,
                            sku: p.sku,
                            barcode: p.barcode,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            unit_price: p.unitPrice,
                            cost_price: p.costPrice,
                            wholesale_price: p.wholesalePrice,
                            tax_rate: p.taxRate,
                            stock: p.stock,
                            is_active: p.isActive,
                            image_url: p.imageUrl,
                            created_at: p.createdAt,
                            updated_at: p.updatedAt,
                        },
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            CreateProduct: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const p = await this.repository.create({
                        companyId: req.company_id || "company_default_pos",
                        sku: req.sku,
                        barcode: req.barcode,
                        title: req.title,
                        description: req.description || "",
                        category: req.category,
                        unitPrice: req.unit_price,
                        costPrice: req.cost_price,
                        wholesalePrice: req.wholesale_price,
                        taxRate: req.tax_rate,
                        stock: req.stock,
                        isActive: req.is_active ?? true,
                        imageUrl: req.image_url || "",
                    });
                    callback(null, {
                        success: true,
                        product: {
                            id: p.id,
                            company_id: p.companyId,
                            sku: p.sku,
                            barcode: p.barcode,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            unit_price: p.unitPrice,
                            cost_price: p.costPrice,
                            wholesale_price: p.wholesalePrice,
                            tax_rate: p.taxRate,
                            stock: p.stock,
                            is_active: p.isActive,
                            image_url: p.imageUrl,
                            created_at: p.createdAt,
                            updated_at: p.updatedAt,
                        },
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            UpdateProduct: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const p = await this.repository.update(req.id, {
                        title: req.title,
                        unitPrice: req.unit_price,
                        costPrice: req.cost_price,
                        wholesalePrice: req.wholesale_price,
                        stock: req.stock,
                        isActive: req.is_active,
                    });
                    if (!p) return callback(null, { success: false, error: "Producto no encontrado" });
                    callback(null, {
                        success: true,
                        product: {
                            id: p.id,
                            company_id: p.companyId,
                            sku: p.sku,
                            barcode: p.barcode,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            unit_price: p.unitPrice,
                            cost_price: p.costPrice,
                            wholesale_price: p.wholesalePrice,
                            tax_rate: p.taxRate,
                            stock: p.stock,
                            is_active: p.isActive,
                            image_url: p.imageUrl,
                            created_at: p.createdAt,
                            updated_at: p.updatedAt,
                        },
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            AdjustStock: async (call: any, callback: any) => {
                try {
                    const req = call.request;
                    const p = await this.repository.adjustStock(req.product_id, req.delta_qty, req.reason);
                    if (!p) return callback(null, { success: false, error: "Producto no encontrado" });
                    callback(null, {
                        success: true,
                        product: {
                            id: p.id,
                            company_id: p.companyId,
                            sku: p.sku,
                            barcode: p.barcode,
                            title: p.title,
                            description: p.description,
                            category: p.category,
                            unit_price: p.unitPrice,
                            cost_price: p.costPrice,
                            wholesale_price: p.wholesalePrice,
                            tax_rate: p.taxRate,
                            stock: p.stock,
                            is_active: p.isActive,
                            image_url: p.imageUrl,
                            created_at: p.createdAt,
                            updated_at: p.updatedAt,
                        },
                    });
                } catch (err: any) {
                    callback(err);
                }
            },

            DeleteProduct: async (call: any, callback: any) => {
                try {
                    const success = await this.repository.delete(call.request.id);
                    callback(null, {
                        success,
                        message: success ? "Producto eliminado exitosamente" : "Producto no encontrado",
                    });
                } catch (err: any) {
                    callback(err);
                }
            },
        });
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(
                `0.0.0.0:${this.port}`,
                grpc.ServerCredentials.createInsecure(),
                (err, boundPort) => {
                    if (err) return reject(err);
                    this.server.start();
                    console.log(`⚡ Catalog gRPC Server running on port ${boundPort} (catalog.proto)`);
                    resolve();
                }
            );
        });
    }

    stop() {
        this.server.forceShutdown();
    }
}
