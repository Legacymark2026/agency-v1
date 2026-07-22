/**
 * Isolated Catalog Repository & Data Store
 * Ensures 100% data and business logic isolation for Products, Services & Stock Audit.
 */
import { EventBus } from "@agency/events";

export interface CatalogEntity {
    id: string;
    companyId: string;
    sku: string;
    barcode: string;
    title: string;
    description: string;
    category: string;
    unitPrice: number;
    costPrice: number;
    wholesalePrice: number;
    taxRate: number;
    stock: number;
    isActive: boolean;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export class IsolatedCatalogRepository {
    private store = new Map<string, CatalogEntity>();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.seedInitialCatalog();
    }

    private seedInitialCatalog() {
        const seedProducts: CatalogEntity[] = [
            { id: "p1", companyId: "company_default_pos", sku: "SERV-001", barcode: "7701001001", title: "Consultoría Estratégica POS (1 hora)", description: "Asesoría personalizada en integración y facturación DIAN", category: "Servicios", unitPrice: 150000, costPrice: 65000, wholesalePrice: 125000, taxRate: 0.19, stock: 99, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p2", companyId: "company_default_pos", sku: "BRAND-002", barcode: "7701001002", title: "Plan Branding & Identidad Corporativa", description: "Diseño de logo, manual de marca y papelería digital", category: "Diseño", unitPrice: 850000, costPrice: 380000, wholesalePrice: 720000, taxRate: 0.19, stock: 50, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p3", companyId: "company_default_pos", sku: "WEB-003", barcode: "7701001003", title: "Desarrollo Web Next.js MVP", description: "Plataforma web de alto rendimiento con backend Node.js", category: "Desarrollo", unitPrice: 1200000, costPrice: 550000, wholesalePrice: 990000, taxRate: 0.19, stock: 20, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p4", companyId: "company_default_pos", sku: "API-004", barcode: "7701001004", title: "Bolsa 100K Peticiones API Gateway", description: "Créditos para microservicios y webhook streaming", category: "SaaS", unitPrice: 120000, costPrice: 35000, wholesalePrice: 95000, taxRate: 0.19, stock: 999, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p5", companyId: "company_default_pos", sku: "HW-005", barcode: "7701001005", title: "Impresora Térmica POS 80mm USB/LAN", description: "Impresora de recibos de alta velocidad con interfaz RJ11", category: "Hardware", unitPrice: 380000, costPrice: 210000, wholesalePrice: 310000, taxRate: 0.19, stock: 15, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p6", companyId: "company_default_pos", sku: "HW-006", barcode: "7701001006", title: "Lector Código de Barras Láser 2D", description: "Escáner omnidireccional USB compatible con QR y Datamatrix", category: "Hardware", unitPrice: 195000, costPrice: 98000, wholesalePrice: 155000, taxRate: 0.19, stock: 25, isActive: true, imageUrl: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        seedProducts.forEach(p => this.store.set(p.id, p));
    }

    async findAll(filter?: { category?: string; search?: string }): Promise<CatalogEntity[]> {
        let list = Array.from(this.store.values()).filter(p => p.isActive);

        if (filter?.category && filter.category !== "Todos") {
            list = list.filter(p => p.category.toLowerCase() === filter.category!.toLowerCase());
        }

        if (filter?.search) {
            const q = filter.search.toLowerCase();
            list = list.filter(p => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
        }

        return list;
    }

    async findByIdOrSku(idOrSku: string): Promise<CatalogEntity | null> {
        const direct = this.store.get(idOrSku);
        if (direct) return direct;

        return Array.from(this.store.values()).find(p => p.sku === idOrSku || p.barcode === idOrSku) || null;
    }

    async create(data: Omit<CatalogEntity, "id" | "createdAt" | "updatedAt">): Promise<CatalogEntity> {
        const id = `p_${Date.now()}`;
        const now = new Date().toISOString();
        const entity: CatalogEntity = {
            ...data,
            id,
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            isActive: data.isActive ?? true,
            createdAt: now,
            updatedAt: now,
        };

        this.store.set(id, entity);

        await this.eventBus.publish("catalog.product.created", {
            productId: entity.id,
            companyId: entity.companyId,
            sku: entity.sku,
            barcode: entity.barcode,
            title: entity.title,
            category: entity.category,
            unitPrice: entity.unitPrice,
            costPrice: entity.costPrice,
            stock: entity.stock,
            timestamp: now,
        });

        return entity;
    }

    async update(id: string, updates: Partial<CatalogEntity>): Promise<CatalogEntity | null> {
        const existing = this.store.get(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        const updated: CatalogEntity = {
            ...existing,
            ...updates,
            updatedAt: now,
        };

        this.store.set(id, updated);

        await this.eventBus.publish("catalog.product.updated", {
            productId: updated.id,
            companyId: updated.companyId,
            sku: updated.sku,
            title: updated.title,
            unitPrice: updated.unitPrice,
            wholesalePrice: updated.wholesalePrice,
            stock: updated.stock,
            timestamp: now,
        });

        return updated;
    }

    async adjustStock(productId: string, deltaQty: number, reason: string): Promise<CatalogEntity | null> {
        const product = this.store.get(productId);
        if (!product) return null;

        const previousStock = product.stock;
        const newStock = Math.max(0, previousStock + deltaQty);
        product.stock = newStock;
        product.updatedAt = new Date().toISOString();

        this.store.set(productId, product);

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

    async delete(id: string): Promise<boolean> {
        const product = this.store.get(id);
        if (!product) return false;

        const now = new Date().toISOString();
        product.isActive = false;
        product.updatedAt = now;
        this.store.set(id, product);

        await this.eventBus.publish("catalog.product.deleted", {
            productId: product.id,
            sku: product.sku,
            title: product.title,
            companyId: product.companyId,
            timestamp: now,
        });

        return true;
    }
}
