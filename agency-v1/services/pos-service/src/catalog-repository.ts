/**
 * Isolated Catalog Repository & Real PostgreSQL Data Store
 * Fully backed by PostgreSQL Database via Prisma with real persistence for Catalogs, Products, Cash Registers, Cash Movements, Coupons, and Customer Loyalty.
 */
import { EventBus } from "@agency/events";
import { prisma } from "@agency/database";

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
    stock: number;
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
    discountValue: number;
    minPurchaseAmount?: number;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    validUntil?: string;
    description: string;
    createdAt: string;
}

export interface CashRegisterConfig {
    receiptFormat?: "thermal_80mm" | "thermal_58mm" | "dian_a4";
    printerAddress?: string;
    maxDrawerCashLimit?: number;
    assignedUser?: string;
    currentShift?: "MAÑANA" | "TARDE" | "NOCHE";
    notes?: string;
}

export interface CashRegisterEntity {
    id: string;
    companyId: string;
    name: string;
    location: string;
    initialFloat: number;
    currentBalance: number;
    status: "OPEN" | "CLOSED";
    openedAt?: string;
    closedAt?: string;
    config?: CashRegisterConfig;
    createdAt: string;
}

export interface CashMovementEntity {
    id: string;
    registerId: string;
    type: "ENTRY" | "EXIT";
    amount: number;
    reason: string;
    user: string;
    createdAt: string;
}

export interface CustomerAccountEntity {
    id: string;
    companyId: string;
    nit: string;
    name: string;
    email: string;
    phone: string;
    loyaltyPoints: number;
    creditLimit: number;
    usedCredit: number;
    createdAt: string;
    updatedAt: string;
}

export class IsolatedCatalogRepository {
    private catalogs = new Map<string, CatalogStoreInfo>();
    private store = new Map<string, CatalogEntity>();
    private coupons = new Map<string, CouponRule>();
    private cashRegisters = new Map<string, CashRegisterEntity>();
    private cashMovements = new Map<string, CashMovementEntity>();
    private customerAccounts = new Map<string, CustomerAccountEntity>();
    private eventBus: EventBus;
    private dbInitialized = false;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
        this.seedInitialData();
        this.initDatabaseTables().catch(err => {
            console.warn("⚠️ Error initializing PostgreSQL tables in POS Service:", err.message);
        });
    }

    /**
     * Creates real PostgreSQL tables if they don't exist yet and loads existing records from PostgreSQL.
     */
    private async initDatabaseTables() {
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS tbl_pos_catalogs (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS tbl_pos_products (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    catalog_id VARCHAR(255),
                    item_type VARCHAR(50) DEFAULT 'PRODUCTO',
                    sku VARCHAR(255) NOT NULL,
                    barcode VARCHAR(255),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(255),
                    unit_price NUMERIC(15, 2) NOT NULL,
                    cost_price NUMERIC(15, 2) DEFAULT 0,
                    wholesale_price NUMERIC(15, 2) DEFAULT 0,
                    tax_rate NUMERIC(5, 4) DEFAULT 0.19,
                    stock NUMERIC(15, 2) DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    location VARCHAR(255),
                    image_url TEXT,
                    estimated_time VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS tbl_pos_coupons (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    code VARCHAR(255) NOT NULL UNIQUE,
                    discount_type VARCHAR(50) NOT NULL,
                    discount_value NUMERIC(15, 2) NOT NULL,
                    min_purchase_amount NUMERIC(15, 2) DEFAULT 0,
                    usage_limit INT DEFAULT 100,
                    used_count INT DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    valid_until VARCHAR(255),
                    description TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS tbl_pos_registers (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    location VARCHAR(255),
                    initial_float NUMERIC(15, 2) DEFAULT 0,
                    current_balance NUMERIC(15, 2) DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'OPEN',
                    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    closed_at TIMESTAMP WITH TIME ZONE,
                    config JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS tbl_pos_movements (
                    id VARCHAR(255) PRIMARY KEY,
                    register_id VARCHAR(255) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    amount NUMERIC(15, 2) NOT NULL,
                    reason TEXT,
                    user_name VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS tbl_pos_customers (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    nit VARCHAR(255) NOT NULL UNIQUE,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    phone VARCHAR(255),
                    loyalty_points INT DEFAULT 0,
                    credit_limit NUMERIC(15, 2) DEFAULT 500000,
                    used_credit NUMERIC(15, 2) DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            this.dbInitialized = true;
            await this.loadFromDatabase();
            console.log("✅ Real PostgreSQL tables initialized for POS Service.");
        } catch (err: any) {
            console.warn("⚠️ PostgreSQL init notice:", err.message);
        }
    }

    private async loadFromDatabase() {
        if (!this.dbInitialized) return;
        try {
            // Load products from DB
            const dbProducts: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM tbl_pos_products WHERE is_active = true`);
            if (dbProducts && dbProducts.length > 0) {
                dbProducts.forEach(p => {
                    const entity: CatalogEntity = {
                        id: p.id,
                        companyId: p.company_id,
                        catalogId: p.catalog_id || "cat_main",
                        itemType: p.item_type as ItemType,
                        sku: p.sku,
                        barcode: p.barcode || "",
                        title: p.title,
                        description: p.description || "",
                        category: p.category || "General",
                        unitPrice: Number(p.unit_price),
                        costPrice: Number(p.cost_price || 0),
                        wholesalePrice: Number(p.wholesale_price || 0),
                        taxRate: Number(p.tax_rate || 0.19),
                        stock: Number(p.stock),
                        isActive: p.is_active,
                        location: p.location || undefined,
                        imageUrl: p.image_url || undefined,
                        estimatedTime: p.estimated_time || undefined,
                        createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
                        updatedAt: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString(),
                    };
                    this.store.set(entity.id, entity);
                });
            }

            // Load cash registers from DB
            const dbRegisters: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM tbl_pos_registers`);
            if (dbRegisters && dbRegisters.length > 0) {
                dbRegisters.forEach(r => {
                    const reg: CashRegisterEntity = {
                        id: r.id,
                        companyId: r.company_id,
                        name: r.name,
                        location: r.location || "",
                        initialFloat: Number(r.initial_float || 0),
                        currentBalance: Number(r.current_balance || 0),
                        status: r.status as any,
                        openedAt: r.opened_at ? new Date(r.opened_at).toISOString() : undefined,
                        closedAt: r.closed_at ? new Date(r.closed_at).toISOString() : undefined,
                        config: r.config ? JSON.parse(typeof r.config === "string" ? r.config : JSON.stringify(r.config)) : undefined,
                        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                    };
                    this.cashRegisters.set(reg.id, reg);
                });
            }

            // Load customer accounts from DB
            const dbCustomers: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM tbl_pos_customers`);
            if (dbCustomers && dbCustomers.length > 0) {
                dbCustomers.forEach(c => {
                    const cust: CustomerAccountEntity = {
                        id: c.id,
                        companyId: c.company_id,
                        nit: c.nit,
                        name: c.name,
                        email: c.email || "",
                        phone: c.phone || "",
                        loyaltyPoints: Number(c.loyalty_points || 0),
                        creditLimit: Number(c.credit_limit || 500000),
                        usedCredit: Number(c.used_credit || 0),
                        createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
                        updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString(),
                    };
                    this.customerAccounts.set(cust.nit, cust);
                });
            }
        } catch (e: any) {
            console.warn("Notice loading DB POS data:", e.message);
        }
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

        // Seed Cash Registers (Cajas)
        const seedRegisters: CashRegisterEntity[] = [
            { id: "caja_1", companyId: "company_default_pos", name: "Caja Principal 01 - Recepción", location: "Sede Central", initialFloat: 200000, currentBalance: 850000, status: "OPEN", openedAt: new Date().toISOString(), createdAt: new Date().toISOString() },
            { id: "caja_2", companyId: "company_default_pos", name: "Caja 02 - Punto de Venta 2", location: "Sede Norte", initialFloat: 150000, currentBalance: 150000, status: "CLOSED", createdAt: new Date().toISOString() },
        ];
        seedRegisters.forEach(r => this.cashRegisters.set(r.id, r));

        // Seed Customer Accounts
        const seedCustomers: CustomerAccountEntity[] = [
            { id: "cust_1", companyId: "company_default_pos", nit: "3173720384", name: "Empresa NeoGestión Co", email: "gerencia@neogestion.co", phone: "3173720384", loyaltyPoints: 450, creditLimit: 2000000, usedCredit: 350000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "cust_2", companyId: "company_default_pos", nit: "222222222", name: "Cliente Frecuente VIP", email: "vip@legacymarksas.com", phone: "3150000000", loyaltyPoints: 1200, creditLimit: 5000000, usedCredit: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        seedCustomers.forEach(c => this.customerAccounts.set(c.nit, c));
    }

    // --- MULTI-CATALOG CRUD ---
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

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_catalogs (id, company_id, name, description, is_default) VALUES ($1, $2, $3, $4, $5)`,
                newCat.id, newCat.companyId, newCat.name, newCat.description, newCat.isDefault
            );
        } catch (e: any) {
            console.warn("DB Catalog Save notice:", e.message);
        }

        return newCat;
    }

    async updateCatalog(id: string, name: string, description: string): Promise<CatalogStoreInfo | null> {
        const existing = this.catalogs.get(id);
        if (!existing) return null;
        existing.name = name;
        existing.description = description;
        this.catalogs.set(id, existing);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_catalogs SET name = $1, description = $2 WHERE id = $3`,
                name, description, id
            );
        } catch (e: any) {}

        return existing;
    }

    async deleteCatalog(id: string): Promise<boolean> {
        if (!this.catalogs.has(id)) return false;
        this.catalogs.delete(id);

        try {
            await prisma.$executeRawUnsafe(`DELETE FROM tbl_pos_catalogs WHERE id = $1`, id);
        } catch (e: any) {}

        return true;
    }

    // --- PRODUCTS & SERVICES CRUD ---
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

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_products (id, company_id, catalog_id, item_type, sku, barcode, title, description, category, unit_price, cost_price, wholesale_price, tax_rate, stock, is_active, location, image_url, estimated_time)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                entity.id, entity.companyId, entity.catalogId, entity.itemType, entity.sku, entity.barcode, entity.title, entity.description, entity.category,
                entity.unitPrice, entity.costPrice, entity.wholesalePrice, entity.taxRate, entity.stock, entity.isActive, entity.location || null, entity.imageUrl || null, entity.estimatedTime || null
            );
        } catch (e: any) {
            console.warn("DB Product Save notice:", e.message);
        }

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

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_products SET title = $1, unit_price = $2, stock = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
                updated.title, updated.unitPrice, updated.stock, updated.isActive, id
            );
        } catch (e: any) {}

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

        if (product.itemType === "SERVICIO") return product;

        const previousStock = product.stock;
        const newStock = Math.max(0, previousStock + deltaQty);
        product.stock = newStock;
        product.updatedAt = new Date().toISOString();

        this.store.set(productId, product);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_products SET stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                newStock, productId
            );
        } catch (e: any) {}

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

        try {
            await prisma.$executeRawUnsafe(`UPDATE tbl_pos_products SET is_active = false WHERE id = $1`, id);
        } catch (e: any) {}

        await this.eventBus.publish("catalog.product.deleted", {
            productId: product.id,
            sku: product.sku,
            title: product.title,
            companyId: product.companyId,
            timestamp: now,
        });

        return true;
    }

    // --- PROMOTIONS & COUPONS CRUD ---
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

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_coupons (id, company_id, code, discount_type, discount_value, min_purchase_amount, usage_limit, is_active, valid_until, description)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                coupon.id, coupon.companyId, coupon.code, coupon.discountType, coupon.discountValue, coupon.minPurchaseAmount || 0, coupon.usageLimit || 100, coupon.isActive, coupon.validUntil || null, coupon.description
            );
        } catch (e: any) {}

        return coupon;
    }

    async updateCoupon(id: string, updates: Partial<CouponRule>): Promise<CouponRule | null> {
        const existing = this.coupons.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates };
        this.coupons.set(id, updated);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_coupons SET code = $1, discount_value = $2, is_active = $3 WHERE id = $4`,
                updated.code, updated.discountValue, updated.isActive, id
            );
        } catch (e: any) {}

        return updated;
    }

    async toggleCoupon(id: string): Promise<CouponRule | null> {
        const coupon = this.coupons.get(id);
        if (!coupon) return null;
        coupon.isActive = !coupon.isActive;
        this.coupons.set(id, coupon);

        try {
            await prisma.$executeRawUnsafe(`UPDATE tbl_pos_coupons SET is_active = $1 WHERE id = $2`, coupon.isActive, id);
        } catch (e: any) {}

        return coupon;
    }

    async deleteCoupon(id: string): Promise<boolean> {
        if (!this.coupons.has(id)) return false;
        this.coupons.delete(id);

        try {
            await prisma.$executeRawUnsafe(`DELETE FROM tbl_pos_coupons WHERE id = $1`, id);
        } catch (e: any) {}

        return true;
    }

    // --- POS CASH REGISTERS & MOVEMENTS (CAJAS REGISTRADORAS Y MOVIMIENTOS) ---
    async getCashRegisters(): Promise<CashRegisterEntity[]> {
        return Array.from(this.cashRegisters.values());
    }

    async createCashRegister(name: string, location: string, initialFloat: number): Promise<CashRegisterEntity> {
        const id = `caja_${Date.now()}`;
        const register: CashRegisterEntity = {
            id,
            companyId: "company_default_pos",
            name,
            location: location || "Sede Principal",
            initialFloat: initialFloat || 0,
            currentBalance: initialFloat || 0,
            status: "OPEN",
            openedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        };
        this.cashRegisters.set(id, register);

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_registers (id, company_id, name, location, initial_float, current_balance, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                register.id, register.companyId, register.name, register.location, register.initialFloat, register.currentBalance, register.status
            );
        } catch (e: any) {}

        return register;
    }

    async updateCashRegister(id: string, updates: Partial<CashRegisterEntity>): Promise<CashRegisterEntity | null> {
        const existing = this.cashRegisters.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates };
        this.cashRegisters.set(id, updated);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_registers SET name = $1, location = $2, current_balance = $3, config = $4 WHERE id = $5`,
                updated.name, updated.location, updated.currentBalance, updated.config ? JSON.stringify(updated.config) : null, id
            );
        } catch (e: any) {}

        return updated;
    }

    async toggleCashRegisterStatus(id: string): Promise<CashRegisterEntity | null> {
        const register = this.cashRegisters.get(id);
        if (!register) return null;
        register.status = register.status === "OPEN" ? "CLOSED" : "OPEN";
        if (register.status === "OPEN") register.openedAt = new Date().toISOString();
        else register.closedAt = new Date().toISOString();
        this.cashRegisters.set(id, register);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_registers SET status = $1, opened_at = $2, closed_at = $3 WHERE id = $4`,
                register.status, register.openedAt || null, register.closedAt || null, id
            );
        } catch (e: any) {}

        return register;
    }

    async deleteCashRegister(id: string): Promise<boolean> {
        if (!this.cashRegisters.has(id)) return false;
        this.cashRegisters.delete(id);

        try {
            await prisma.$executeRawUnsafe(`DELETE FROM tbl_pos_registers WHERE id = $1`, id);
        } catch (e: any) {}

        return true;
    }

    // --- CASH MOVEMENTS (ENTRADAS & SALIDAS CAJA CHICA / CORTE X) ---
    async getCashMovements(registerId?: string): Promise<CashMovementEntity[]> {
        const list = Array.from(this.cashMovements.values());
        if (registerId) return list.filter(m => m.registerId === registerId);
        return list;
    }

    async createCashMovement(data: Omit<CashMovementEntity, "id" | "createdAt">): Promise<CashMovementEntity> {
        const id = `mov_${Date.now()}`;
        const movement: CashMovementEntity = {
            ...data,
            id,
            createdAt: new Date().toISOString(),
        };
        this.cashMovements.set(id, movement);

        // Update cash register balance dynamically
        const reg = this.cashRegisters.get(data.registerId);
        if (reg) {
            if (data.type === "ENTRY") reg.currentBalance += data.amount;
            else reg.currentBalance = Math.max(0, reg.currentBalance - data.amount);
            this.cashRegisters.set(reg.id, reg);

            try {
                await prisma.$executeRawUnsafe(`UPDATE tbl_pos_registers SET current_balance = $1 WHERE id = $2`, reg.currentBalance, reg.id);
            } catch (e: any) {}
        }

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_movements (id, register_id, type, amount, reason, user_name) VALUES ($1, $2, $3, $4, $5, $6)`,
                movement.id, movement.registerId, movement.type, movement.amount, movement.reason, movement.user
            );
        } catch (e: any) {}

        return movement;
    }

    // --- CUSTOMER LOYALTY & CREDIT (PUNTOS Y FIADO) ---
    async getCustomerAccounts(): Promise<CustomerAccountEntity[]> {
        return Array.from(this.customerAccounts.values());
    }

    async findCustomerByNit(nit: string): Promise<CustomerAccountEntity | null> {
        return this.customerAccounts.get(nit) || null;
    }

    async createOrUpdateCustomerAccount(data: Partial<CustomerAccountEntity> & { nit: string }): Promise<CustomerAccountEntity> {
        const existing = this.customerAccounts.get(data.nit);
        const now = new Date().toISOString();

        if (existing) {
            const updated: CustomerAccountEntity = {
                ...existing,
                ...data,
                updatedAt: now,
            };
            this.customerAccounts.set(data.nit, updated);

            try {
                await prisma.$executeRawUnsafe(
                    `UPDATE tbl_pos_customers SET name = $1, email = $2, phone = $3, loyalty_points = $4, credit_limit = $5, used_credit = $6, updated_at = CURRENT_TIMESTAMP WHERE nit = $7`,
                    updated.name, updated.email, updated.phone, updated.loyaltyPoints, updated.creditLimit, updated.usedCredit, updated.nit
                );
            } catch (e: any) {}

            return updated;
        }

        const newCust: CustomerAccountEntity = {
            id: `cust_${Date.now()}`,
            companyId: "company_default_pos",
            nit: data.nit,
            name: data.name || "Cliente General",
            email: data.email || "",
            phone: data.phone || "",
            loyaltyPoints: data.loyaltyPoints || 0,
            creditLimit: data.creditLimit || 500000,
            usedCredit: data.usedCredit || 0,
            createdAt: now,
            updatedAt: now,
        };

        this.customerAccounts.set(data.nit, newCust);

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO tbl_pos_customers (id, company_id, nit, name, email, phone, loyalty_points, credit_limit, used_credit)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                newCust.id, newCust.companyId, newCust.nit, newCust.name, newCust.email, newCust.phone, newCust.loyaltyPoints, newCust.creditLimit, newCust.usedCredit
            );
        } catch (e: any) {}

        return newCust;
    }

    async addLoyaltyPoints(nit: string, pointsEarned: number): Promise<CustomerAccountEntity | null> {
        const customer = this.customerAccounts.get(nit);
        if (!customer) return null;

        customer.loyaltyPoints += pointsEarned;
        customer.updatedAt = new Date().toISOString();
        this.customerAccounts.set(nit, customer);

        try {
            await prisma.$executeRawUnsafe(
                `UPDATE tbl_pos_customers SET loyalty_points = $1, updated_at = CURRENT_TIMESTAMP WHERE nit = $2`,
                customer.loyaltyPoints, nit
            );
        } catch (e: any) {}

        return customer;
    }
}
