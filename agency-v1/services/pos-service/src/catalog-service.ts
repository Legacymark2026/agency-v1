/**
 * Catalog Microservice Module — Dedicated Product/Service Store & Event Publisher
 * Features: Complete CRUD API, Multi-price Tiers, Stock Auditing & Event Bus Notifications
 */
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";

export interface CatalogProduct {
    id: string;
    companyId: string;
    sku: string;
    barcode: string;
    title: string;
    description?: string;
    category: string;
    unitPrice: number;
    costPrice: number;
    wholesalePrice: number;
    taxRate: number;
    stock: number;
    isActive: boolean;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// In-Memory Fallback Catalog Store (Resilient microservice DB caching)
const CATALOG_STORE = new Map<string, CatalogProduct>([
    [
        "p1",
        {
            id: "p1",
            companyId: "company_default_pos",
            sku: "SERV-001",
            barcode: "7701001001",
            title: "Consultoría Estratégica POS (1 hora)",
            description: "Asesoría personalizada en integración y facturación DIAN",
            category: "Servicios",
            unitPrice: 150000,
            costPrice: 65000,
            wholesalePrice: 125000,
            taxRate: 0.19,
            stock: 99,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        "p2",
        {
            id: "p2",
            companyId: "company_default_pos",
            sku: "BRAND-002",
            barcode: "7701001002",
            title: "Plan Branding & Identidad Corporativa",
            description: "Diseño de logo, manual de marca y papelería digital",
            category: "Diseño",
            unitPrice: 850000,
            costPrice: 380000,
            wholesalePrice: 720000,
            taxRate: 0.19,
            stock: 50,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        "p3",
        {
            id: "p3",
            companyId: "company_default_pos",
            sku: "WEB-003",
            barcode: "7701001003",
            title: "Desarrollo Web Next.js MVP",
            description: "Plataforma web de alto rendimiento con backend Node.js",
            category: "Desarrollo",
            unitPrice: 1200000,
            costPrice: 550000,
            wholesalePrice: 990000,
            taxRate: 0.19,
            stock: 20,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        "p4",
        {
            id: "p4",
            companyId: "company_default_pos",
            sku: "API-004",
            barcode: "7701001004",
            title: "Bolsa 100K Peticiones API Gateway",
            description: "Créditos para microservicios y webhook streaming",
            category: "SaaS",
            unitPrice: 120000,
            costPrice: 35000,
            wholesalePrice: 95000,
            taxRate: 0.19,
            stock: 999,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        "p5",
        {
            id: "p5",
            companyId: "company_default_pos",
            sku: "HW-005",
            barcode: "7701001005",
            title: "Impresora Térmica POS 80mm USB/LAN",
            description: "Impresora de recibos de alta velocidad con interfaz RJ11",
            category: "Hardware",
            unitPrice: 380000,
            costPrice: 210000,
            wholesalePrice: 310000,
            taxRate: 0.19,
            stock: 15,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
    [
        "p6",
        {
            id: "p6",
            companyId: "company_default_pos",
            sku: "HW-006",
            barcode: "7701001006",
            title: "Lector Código de Barras Láser 2D",
            description: "Escáner omnidireccional USB compatible con QR y Datamatrix",
            category: "Hardware",
            unitPrice: 195000,
            costPrice: 98000,
            wholesalePrice: 155000,
            taxRate: 0.19,
            stock: 25,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ],
]);

export class CatalogService {
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    /**
     * List all products filtered by company, category or search query
     */
    async getProducts(params: { companyId?: string; category?: string; search?: string; activeOnly?: boolean }): Promise<CatalogProduct[]> {
        let items = Array.from(CATALOG_STORE.values());

        if (params.activeOnly !== false) {
            items = items.filter(p => p.isActive);
        }

        if (params.category && params.category !== "Todos") {
            items = items.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
        }

        if (params.search) {
            const q = params.search.toLowerCase();
            items = items.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                p.barcode.includes(q)
            );
        }

        return items;
    }

    /**
     * Get single product details by ID or barcode/SKU
     */
    async getProductById(idOrSku: string): Promise<CatalogProduct | null> {
        const direct = CATALOG_STORE.get(idOrSku);
        if (direct) return direct;

        return Array.from(CATALOG_STORE.values()).find(
            p => p.sku === idOrSku || p.barcode === idOrSku
        ) || null;
    }

    /**
     * Create a new Product / Service & Emit `catalog.product.created` Event
     */
    async createProduct(data: Omit<CatalogProduct, "id" | "createdAt" | "updatedAt">): Promise<CatalogProduct> {
        const id = `p_${Date.now()}`;
        const newProduct: CatalogProduct = {
            ...data,
            id,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        CATALOG_STORE.set(id, newProduct);

        // Publish EDA Event to EventBus
        await this.eventBus.publish("catalog.product.created", {
            productId: newProduct.id,
            companyId: newProduct.companyId,
            sku: newProduct.sku,
            barcode: newProduct.barcode,
            title: newProduct.title,
            category: newProduct.category,
            unitPrice: newProduct.unitPrice,
            costPrice: newProduct.costPrice,
            stock: newProduct.stock,
            timestamp: newProduct.createdAt,
        });

        return newProduct;
    }

    /**
     * Update existing Product attributes/pricing & Emit `catalog.product.updated` Event
     */
    async updateProduct(id: string, updates: Partial<CatalogProduct>): Promise<CatalogProduct | null> {
        const existing = CATALOG_STORE.get(id);
        if (!existing) return null;

        const updated: CatalogProduct = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        CATALOG_STORE.set(id, updated);

        // Publish EDA Event
        await this.eventBus.publish("catalog.product.updated", {
            productId: updated.id,
            companyId: updated.companyId,
            sku: updated.sku,
            title: updated.title,
            unitPrice: updated.unitPrice,
            wholesalePrice: updated.wholesalePrice,
            stock: updated.stock,
            timestamp: updated.updatedAt,
        });

        return updated;
    }

    /**
     * Adjust Product Inventory Stock & Emit `catalog.stock.updated` Event
     */
    async adjustStock(productId: string, deltaQty: number, reason: string): Promise<CatalogProduct | null> {
        const product = CATALOG_STORE.get(productId);
        if (!product) return null;

        const previousStock = product.stock;
        const newStock = Math.max(0, previousStock + deltaQty);
        product.stock = newStock;
        product.updatedAt = new Date().toISOString();

        CATALOG_STORE.set(productId, product);

        // Publish EDA Event
        await this.eventBus.publish("catalog.stock.updated", {
            productId: product.id,
            sku: product.sku,
            previousStock,
            newStock,
            reason,
            timestamp: product.updatedAt,
        });

        return product;
    }

    /**
     * Delete (deactivate) a product & Emit `catalog.product.deleted` Event
     */
    async deleteProduct(id: string): Promise<boolean> {
        const product = CATALOG_STORE.get(id);
        if (!product) return false;

        product.isActive = false;
        product.updatedAt = new Date().toISOString();
        CATALOG_STORE.set(id, product);

        await this.eventBus.publish("catalog.product.deleted", {
            productId: product.id,
            sku: product.sku,
            title: product.title,
            companyId: product.companyId,
            timestamp: product.updatedAt,
        });

        return true;
    }
}
