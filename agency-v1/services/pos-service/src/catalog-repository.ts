/**
 * Isolated Catalog Repository & Data Store
 * Supports Multi-Catalog Management, Item Type (PRODUCTO vs SERVICIO), & Promotions Engine.
 */
import { EventBus } from "@agency/events";

export type ItemType = "PRODUCTO" | "SERVICIO";

export interface CatalogStoreInfo {
    id: string;
    companyId: string;
    name: string;
    description: string;
    isDefault: boolean;
    createdAt: string;
}

export interface CatalogEntity {
    id: string;
    companyId: string;
    catalogId?: string;
    itemType?: ItemType;
    sku: string;
    barcode: string;
    title: string;
    description: string;
    category: string;
    unitPrice: number;
    costPrice: number;
    wholesalePrice: number;
    taxRate: number;
    stock: number; // Subject to inventory ONLY if itemType === "PRODUCTO"
    isActive: boolean;
    location?: string;
    imageUrl?: string;
    estimatedTime?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CouponRule {
    id: string;
    companyId: string;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_COP" | "BUY_X_GET_Y";
    discountValue: number; // e.g. 15 for 15% or 20000 for $20,000 COP
    minPurchaseAmount?: number;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    validUntil?: string;
    description: string;
    createdAt: string;
}

export class IsolatedCatalogRepository {
    private catalogs = new Map<string, CatalogStoreInfo>();
    private store = new Map<string, CatalogEntity>();
    private coupons = new Map<string, CouponRule>();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.seedInitialData();
    }

    private seedInitialData() {
        const defaultCat: CatalogStoreInfo = {
            id: "cat_main",
            companyId: "company_default_pos",
            name: "Catálogo Principal 2026",
            description: "Catálogo maestro de productos físicos y servicios empresariales",
            isDefault: true,
            createdAt: new Date().toISOString(),
        };

        const wholesaleCat: CatalogStoreInfo = {
            id: "cat_wholesale",
            companyId: "company_default_pos",
            name: "Catálogo Mayoristas & Distribuidores",
            description: "Tarifas especiales para compras al por mayor",
            isDefault: false,
            createdAt: new Date().toISOString(),
        };

        this.catalogs.set(defaultCat.id, defaultCat);
        this.catalogs.set(wholesaleCat.id, wholesaleCat);

        const seedProducts: CatalogEntity[] = [
            { id: "p1", companyId: "company_default_pos", catalogId: "cat_main", itemType: "SERVICIO", sku: "SERV-001", barcode: "7701001001", title: "Consultoría Estratégica POS (1 hora)", description: "Asesoría personalizada en integración y facturación DIAN", category: "Servicios", unitPrice: 150000, costPrice: 65000, wholesalePrice: 125000, taxRate: 0.19, stock: 999999, isActive: true, estimatedTime: "1 hora", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p2", companyId: "company_default_pos", catalogId: "cat_main", itemType: "SERVICIO", sku: "BRAND-002", barcode: "7701001002", title: "Plan Branding & Identidad Corporativa", description: "Diseño de logo, manual de marca y papelería digital", category: "Diseño", unitPrice: 850000, costPrice: 380000, wholesalePrice: 720000, taxRate: 0.19, stock: 999999, isActive: true, estimatedTime: "3 días hábiles", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p3", companyId: "company_default_pos", catalogId: "cat_main", itemType: "PRODUCTO", sku: "HW-005", barcode: "7701001005", title: "Impresora Térmica POS 80mm USB/LAN", description: "Impresora de recibos de alta velocidad con interfaz RJ11", category: "Hardware", unitPrice: 380000, costPrice: 210000, wholesalePrice: 310000, taxRate: 0.19, stock: 15, isActive: true, location: "Bodega Principal - Pasillo A1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "p4", companyId: "company_default_pos", catalogId: "cat_main", itemType: "PRODUCTO", sku: "HW-006", barcode: "7701001006", title: "Lector Código de Barras Láser 2D", description: "Escáner omnidireccional USB compatible con QR y Datamatrix", category: "Hardware", unitPrice: 195000, costPrice: 98000, wholesalePrice: 155000, taxRate: 0.19, stock: 25, isActive: true, location: "Bodega Principal - Pasillo A2", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        seedProducts.forEach(p => this.store.set(p.id, p));

        // Seed Coupons & Promotions
        const seedCoupons: CouponRule[] = [
            { id: "c1", companyId: "company_default_pos", code: "BIENVENIDA15", discountType: "PERCENTAGE", discountValue: 15, minPurchaseAmount: 100000, usageLimit: 100, usedCount: 12, isActive: true, validUntil: "2026-12-31", description: "Descuento del 15% para clientes nuevos", createdAt: new Date().toISOString() },
            { id: "c2", companyId: "company_default_pos", code: "PROMO50K", discountType: "FIXED_COP", discountValue: 50000, minPurchaseAmount: 300000, usageLimit: 50, usedCount: 5, isActive: true, validUntil: "2026-12-31", description: "$50.000 COP de descuento en compras superiores a $300.000", createdAt: new Date().toISOString() },
        ];
        seedCoupons.forEach(c => this.coupons.set(c.id, c));
    }

    // --- CATALOG MANAGEMENT ---
    async getCatalogs(): Promise<CatalogStoreInfo[]> {
        return Array.from(this.catalogs.values());
    }

    async createCatalog(name: string, description: string): Promise<CatalogStoreInfo> {
        const id = `cat_${Date.now()}`;
        const newCat: CatalogStoreInfo = {
            id,
            companyId: "company_default_pos",
            name,
            description,
            isDefault: false,
            createdAt: new Date().toISOString(),
        };
        this.catalogs.set(id, newCat);
        return newCat;
    }

    async findAll(filter?: { catalogId?: string; category?: string; itemType?: ItemType; search?: string }): Promise<CatalogEntity[]> {
        let list = Array.from(this.store.values()).filter(p => p.isActive);

        if (filter?.catalogId) {
            list = list.filter(p => p.catalogId === filter.catalogId);
        }

        if (filter?.itemType) {
            list = list.filter(p => p.itemType === filter.itemType);
        }

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
        const itemType = data.itemType || "PRODUCTO";
        const entity: CatalogEntity = {
            ...data,
            id,
            catalogId: data.catalogId || "cat_main",
            itemType,
            stock: itemType === "SERVICIO" ? 999999 : (data.stock ?? 0),
            description: data.description || "",
            isActive: data.isActive ?? true,
            createdAt: now,
            updatedAt: now,
        };

        this.store.set(id, entity);

        await this.eventBus.publish("catalog.product.created", {
            productId: entity.id,
            companyId: entity.companyId,
            catalogId: entity.catalogId,
            itemType: entity.itemType,
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
            stock: existing.itemType === "SERVICIO" ? 999999 : (updates.stock ?? existing.stock),
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

        // Services are NOT subject to inventory management
        if (product.itemType === "SERVICIO") {
            return product;
        }

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

    // --- PROMOTIONS & COUPONS MANAGEMENT ---
    async getCoupons(): Promise<CouponRule[]> {
        return Array.from(this.coupons.values());
    }

    async createCoupon(data: Omit<CouponRule, "id" | "usedCount" | "createdAt">): Promise<CouponRule> {
        const id = `coupon_${Date.now()}`;
        const coupon: CouponRule = {
            ...data,
            id,
            code: data.code.toUpperCase().trim(),
            usedCount: 0,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
        };
        this.coupons.set(id, coupon);
        return coupon;
    }

    async toggleCoupon(id: string): Promise<CouponRule | null> {
        const coupon = this.coupons.get(id);
        if (!coupon) return null;
        coupon.isActive = !coupon.isActive;
        this.coupons.set(id, coupon);
        return coupon;
    }
}
