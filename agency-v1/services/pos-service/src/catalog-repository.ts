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

export interface DatafonoTerminalEntity {
    id: string;
    companyId: string;
    registerId?: string;
    name: string;
    provider: "BOLD" | "REDEBAN" | "WOMPI" | "CREDIBANCO" | "SUMUP";
    connectionType: "BLUETOOTH" | "WIFI" | "USB_SERIAL";
    terminalIp?: string;
    bluetoothMac?: string;
    usbPort?: string;
    terminalId: string;
    merchantId: string;
    hmacSecretKey: string;
    isDefault: boolean;
    isActive: boolean;
    lastPingStatus?: "ONLINE" | "OFFLINE";
    lastPingAt?: string;
    createdAt: string;
    updatedAt: string;
}

export class IsolatedCatalogRepository {
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
        this.eventBus = eventBus;
    }

    // --- MULTI-CATALOG CRUD ---
    async getCatalogs(): Promise<CatalogStoreInfo[]> {
        const records = await prisma.posCatalog.findMany();
        return records.map((record: any) => ({
            id: record.id,
            companyId: record.companyId,
            name: record.name,
            description: record.description || "",
            isDefault: record.isDefault || false,
            createdAt: record.createdAt.toISOString()
        }));
    }

    async createCatalog(name: string, description: string): Promise<CatalogStoreInfo> {
        const id = `cat_${Date.now()}`;
        const record = await prisma.posCatalog.create({
            data: {
                id,
                companyId: "company_default_pos",
                name,
                description,
                isDefault: false
            }
        });
        return {
            id: record.id,
            companyId: record.companyId,
            name: record.name,
            description: record.description || "",
            isDefault: record.isDefault || false,
            createdAt: record.createdAt.toISOString()
        };
    }

    async updateCatalog(id: string, name: string, description: string): Promise<CatalogStoreInfo | null> {
        const record = await prisma.posCatalog.update({
            where: { id },
            data: { name, description }
        });
        return {
            id: record.id,
            companyId: record.companyId,
            name: record.name,
            description: record.description || "",
            isDefault: record.isDefault || false,
            createdAt: record.createdAt.toISOString()
        };
    }

    async deleteCatalog(id: string): Promise<boolean> {
        await prisma.posCatalog.delete({ where: { id } });
        return true;
    }

    // --- PRODUCTS & SERVICES CRUD ---
    private mapProduct(record: any): CatalogEntity {
        return {
            id: record.id,
            companyId: record.companyId,
            catalogId: record.catalogId || undefined,
            itemType: record.itemType as ItemType,
            sku: record.sku,
            barcode: record.barcode || "",
            title: record.title,
            description: record.description || "",
            category: record.category || "General",
            unitPrice: Number(record.unitPrice),
            costPrice: Number(record.costPrice || 0),
            wholesalePrice: Number(record.wholesalePrice || 0),
            taxRate: Number(record.taxRate || 0.19),
            stock: Number(record.stock),
            isActive: record.isActive,
            location: record.location || undefined,
            imageUrl: record.imageUrl || undefined,
            estimatedTime: record.estimatedTime || undefined,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        };
    }

    async findAll(filter?: { catalogId?: string; category?: string; itemType?: ItemType; search?: string }): Promise<CatalogEntity[]> {
        const where: any = { isActive: true };

        if (filter?.catalogId) {
            where.catalogId = filter.catalogId;
        }
        if (filter?.itemType) {
            where.itemType = filter.itemType;
        }
        if (filter?.category && filter.category !== "Todos") {
            where.category = { equals: filter.category, mode: "insensitive" };
        }
        if (filter?.search) {
            where.OR = [
                { title: { contains: filter.search, mode: 'insensitive' } },
                { sku: { contains: filter.search, mode: 'insensitive' } },
                { barcode: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        const records = await prisma.posProduct.findMany({ where });
        return records.map((p: any) => this.mapProduct(p));
    }

    async findByIdOrSku(idOrSku: string): Promise<CatalogEntity | null> {
        const record = await prisma.posProduct.findFirst({
            where: {
                OR: [
                    { id: idOrSku },
                    { sku: idOrSku },
                    { barcode: idOrSku }
                ]
            }
        });
        return record ? this.mapProduct(record) : null;
    }

    async create(data: Omit<CatalogEntity, "id" | "createdAt" | "updatedAt">): Promise<CatalogEntity> {
        const id = `p_${Date.now()}`;
        const itemType = data.itemType || "PRODUCTO";
        const stock = itemType === "SERVICIO" ? 999999 : (data.stock ?? 0);

        const record = await prisma.posProduct.create({
            data: {
                id,
                companyId: data.companyId || "company_default_pos",
                catalogId: data.catalogId || "cat_main",
                itemType,
                sku: data.sku,
                barcode: data.barcode || "",
                title: data.title,
                description: data.description || "",
                category: data.category || "General",
                unitPrice: data.unitPrice,
                costPrice: data.costPrice || 0,
                wholesalePrice: data.wholesalePrice || 0,
                taxRate: data.taxRate || 0.19,
                stock,
                isActive: data.isActive ?? true,
                location: data.location,
                imageUrl: data.imageUrl,
                estimatedTime: data.estimatedTime,
            }
        });

        const entity = this.mapProduct(record);

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
            timestamp: entity.createdAt,
        });

        return entity;
    }

    async update(id: string, updates: Partial<CatalogEntity>): Promise<CatalogEntity | null> {
        const existing = await prisma.posProduct.findUnique({ where: { id } });
        if (!existing) return null;

        const stock = existing.itemType === "SERVICIO" ? 999999 : (updates.stock ?? existing.stock);

        const record = await prisma.posProduct.update({
            where: { id },
            data: {
                title: updates.title,
                unitPrice: updates.unitPrice,
                stock,
                isActive: updates.isActive,
                companyId: updates.companyId,
                catalogId: updates.catalogId,
                itemType: updates.itemType,
                sku: updates.sku,
                barcode: updates.barcode,
                description: updates.description,
                category: updates.category,
                costPrice: updates.costPrice,
                wholesalePrice: updates.wholesalePrice,
                taxRate: updates.taxRate,
                location: updates.location,
                imageUrl: updates.imageUrl,
                estimatedTime: updates.estimatedTime,
            }
        });

        const updated = this.mapProduct(record);

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

    async adjustStock(productId: string, deltaQty: number, reason: string): Promise<CatalogEntity | null> {
        const existing = await prisma.posProduct.findUnique({ where: { id: productId } });
        if (!existing) return null;

        if (existing.itemType === "SERVICIO") return this.mapProduct(existing);

        const previousStock = Number(existing.stock);
        const newStock = Math.max(0, previousStock + deltaQty);

        const record = await prisma.posProduct.update({
            where: { id: productId },
            data: { stock: newStock }
        });

        const updated = this.mapProduct(record);

        await this.eventBus.publish("catalog.stock.updated", {
            productId: updated.id,
            sku: updated.sku,
            previousStock,
            newStock,
            reason,
            timestamp: updated.updatedAt,
        });

        return updated;
    }

    async delete(id: string): Promise<boolean> {
        const existing = await prisma.posProduct.findUnique({ where: { id } });
        if (!existing) return false;

        const record = await prisma.posProduct.update({
            where: { id },
            data: { isActive: false }
        });

        await this.eventBus.publish("catalog.product.deleted", {
            productId: record.id,
            sku: record.sku,
            title: record.title,
            companyId: record.companyId,
            timestamp: record.updatedAt.toISOString(),
        });

        return true;
    }

    // --- PROMOTIONS & COUPONS CRUD ---
    private mapCoupon(record: any): CouponRule {
        return {
            id: record.id,
            companyId: record.companyId,
            code: record.code,
            discountType: record.discountType as any,
            discountValue: Number(record.discountValue),
            minPurchaseAmount: Number(record.minPurchaseAmount || 0),
            usageLimit: Number(record.usageLimit || 100),
            usedCount: Number(record.usedCount || 0),
            isActive: record.isActive,
            validUntil: record.validUntil || undefined,
            description: record.description || "",
            createdAt: record.createdAt.toISOString(),
        };
    }

    async getCoupons(): Promise<CouponRule[]> {
        const records = await prisma.posCoupon.findMany();
        return records.map((c: any) => this.mapCoupon(c));
    }

    async createCoupon(data: Omit<CouponRule, "id" | "usedCount" | "createdAt">): Promise<CouponRule> {
        const id = `coupon_${Date.now()}`;
        const record = await prisma.posCoupon.create({
            data: {
                id,
                companyId: data.companyId || "company_default_pos",
                code: data.code.toUpperCase().trim(),
                discountType: data.discountType,
                discountValue: data.discountValue,
                minPurchaseAmount: data.minPurchaseAmount || 0,
                usageLimit: data.usageLimit || 100,
                usedCount: 0,
                isActive: data.isActive ?? true,
                validUntil: data.validUntil || null,
                description: data.description || "",
            }
        });
        return this.mapCoupon(record);
    }

    async updateCoupon(id: string, updates: Partial<CouponRule>): Promise<CouponRule | null> {
        const record = await prisma.posCoupon.update({
            where: { id },
            data: {
                code: updates.code?.toUpperCase().trim(),
                discountValue: updates.discountValue,
                isActive: updates.isActive,
                discountType: updates.discountType,
                minPurchaseAmount: updates.minPurchaseAmount,
                usageLimit: updates.usageLimit,
                validUntil: updates.validUntil,
                description: updates.description,
            }
        });
        return this.mapCoupon(record);
    }

    async toggleCoupon(id: string): Promise<CouponRule | null> {
        const existing = await prisma.posCoupon.findUnique({ where: { id } });
        if (!existing) return null;

        const record = await prisma.posCoupon.update({
            where: { id },
            data: { isActive: !existing.isActive }
        });
        return this.mapCoupon(record);
    }

    async deleteCoupon(id: string): Promise<boolean> {
        await prisma.posCoupon.delete({ where: { id } });
        return true;
    }

    // --- POS CASH REGISTERS & MOVEMENTS ---
    private mapRegister(record: any): CashRegisterEntity {
        return {
            id: record.id,
            companyId: record.companyId,
            name: record.name,
            location: record.location || "",
            initialFloat: Number(record.initialFloat || 0),
            currentBalance: Number(record.currentBalance || 0),
            status: record.status as any,
            openedAt: record.openedAt ? record.openedAt.toISOString() : undefined,
            closedAt: record.closedAt ? record.closedAt.toISOString() : undefined,
            config: record.config ? JSON.parse(typeof record.config === "string" ? record.config : JSON.stringify(record.config)) : undefined,
            createdAt: record.createdAt.toISOString(),
        };
    }

    async getCashRegisters(): Promise<CashRegisterEntity[]> {
        const records = await prisma.posRegister.findMany();
        return records.map((r: any) => this.mapRegister(r));
    }

    async createCashRegister(name: string, location: string, initialFloat: number): Promise<CashRegisterEntity> {
        const id = `caja_${Date.now()}`;
        const record = await prisma.posRegister.create({
            data: {
                id,
                companyId: "company_default_pos",
                name,
                location: location || "Sede Principal",
                initialFloat: initialFloat || 0,
                currentBalance: initialFloat || 0,
                status: "OPEN",
                openedAt: new Date(),
            }
        });
        return this.mapRegister(record);
    }

    async updateCashRegister(id: string, updates: Partial<CashRegisterEntity>): Promise<CashRegisterEntity | null> {
        const record = await prisma.posRegister.update({
            where: { id },
            data: {
                name: updates.name,
                location: updates.location,
                currentBalance: updates.currentBalance,
                config: updates.config ? JSON.parse(JSON.stringify(updates.config)) : undefined,
            }
        });
        return this.mapRegister(record);
    }

    async toggleCashRegisterStatus(id: string): Promise<CashRegisterEntity | null> {
        const existing = await prisma.posRegister.findUnique({ where: { id } });
        if (!existing) return null;

        const isOpening = existing.status !== "OPEN";
        const record = await prisma.posRegister.update({
            where: { id },
            data: {
                status: isOpening ? "OPEN" : "CLOSED",
                openedAt: isOpening ? new Date() : existing.openedAt,
                closedAt: isOpening ? existing.closedAt : new Date()
            }
        });
        return this.mapRegister(record);
    }

    async deleteCashRegister(id: string): Promise<boolean> {
        await prisma.posRegister.delete({ where: { id } });
        return true;
    }

    // --- CASH MOVEMENTS ---
    private mapMovement(record: any): CashMovementEntity {
        return {
            id: record.id,
            registerId: record.registerId,
            type: record.type as any,
            amount: Number(record.amount),
            reason: record.reason || "",
            user: record.userName || "",
            createdAt: record.createdAt.toISOString(),
        };
    }

    async getCashMovements(registerId?: string): Promise<CashMovementEntity[]> {
        const where = registerId ? { registerId } : {};
        const records = await prisma.posMovement.findMany({ where });
        return records.map((m: any) => this.mapMovement(m));
    }

    async createCashMovement(data: Omit<CashMovementEntity, "id" | "createdAt">): Promise<CashMovementEntity> {
        const id = `mov_${Date.now()}`;
        const record = await prisma.posMovement.create({
            data: {
                id,
                registerId: data.registerId,
                type: data.type,
                amount: data.amount,
                reason: data.reason,
                userName: data.user,
            }
        });

        const reg = await prisma.posRegister.findUnique({ where: { id: data.registerId } });
        if (reg) {
            const currentBalance = Number(reg.currentBalance);
            const newBalance = data.type === "ENTRY" ? currentBalance + data.amount : Math.max(0, currentBalance - data.amount);
            await prisma.posRegister.update({
                where: { id: reg.id },
                data: { currentBalance: newBalance }
            });
        }

        return this.mapMovement(record);
    }

    // --- CUSTOMER LOYALTY & CREDIT ---
    private mapCustomer(record: any): CustomerAccountEntity {
        return {
            id: record.id,
            companyId: record.companyId,
            nit: record.nit,
            name: record.name,
            email: record.email || "",
            phone: record.phone || "",
            loyaltyPoints: Number(record.loyaltyPoints || 0),
            creditLimit: Number(record.creditLimit || 500000),
            usedCredit: Number(record.usedCredit || 0),
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        };
    }

    async getCustomerAccounts(): Promise<CustomerAccountEntity[]> {
        const records = await prisma.posCustomer.findMany();
        return records.map((c: any) => this.mapCustomer(c));
    }

    async findCustomerByNit(nit: string): Promise<CustomerAccountEntity | null> {
        const record = await prisma.posCustomer.findUnique({ where: { nit } });
        return record ? this.mapCustomer(record) : null;
    }

    async createOrUpdateCustomerAccount(data: Partial<CustomerAccountEntity> & { nit: string }): Promise<CustomerAccountEntity> {
        const existing = await prisma.posCustomer.findUnique({ where: { nit: data.nit } });

        if (existing) {
            const record = await prisma.posCustomer.update({
                where: { nit: data.nit },
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    loyaltyPoints: data.loyaltyPoints,
                    creditLimit: data.creditLimit,
                    usedCredit: data.usedCredit,
                }
            });
            return this.mapCustomer(record);
        }

        const id = `cust_${Date.now()}`;
        const record = await prisma.posCustomer.create({
            data: {
                id,
                companyId: "company_default_pos",
                nit: data.nit,
                name: data.name || "Cliente General",
                email: data.email || "",
                phone: data.phone || "",
                loyaltyPoints: data.loyaltyPoints || 0,
                creditLimit: data.creditLimit || 500000,
                usedCredit: data.usedCredit || 0,
            }
        });
        return this.mapCustomer(record);
    }

    async addLoyaltyPoints(nit: string, pointsEarned: number): Promise<CustomerAccountEntity | null> {
        const existing = await prisma.posCustomer.findUnique({ where: { nit } });
        if (!existing) return null;

        const newPoints = Number(existing.loyaltyPoints) + pointsEarned;
        const record = await prisma.posCustomer.update({
            where: { nit },
            data: { loyaltyPoints: newPoints }
        });

        return this.mapCustomer(record);
    }

    // --- DATÁFONO POS TERMINALS HARDWARE CRUD ---
    private mapDatafono(record: any): DatafonoTerminalEntity {
        return {
            id: record.id,
            companyId: record.companyId,
            registerId: record.registerId || undefined,
            name: record.name,
            provider: record.provider as any,
            connectionType: record.connectionType as any,
            terminalIp: record.terminalIp || undefined,
            bluetoothMac: record.bluetoothMac || undefined,
            usbPort: record.usbPort || undefined,
            terminalId: record.terminalId,
            merchantId: record.merchantId,
            hmacSecretKey: record.hmacSecretKey,
            isDefault: record.isDefault,
            isActive: record.isActive,
            lastPingStatus: record.lastPingStatus as any,
            lastPingAt: record.lastPingAt ? record.lastPingAt.toISOString() : undefined,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
        };
    }

    async getDatafonoTerminals(): Promise<DatafonoTerminalEntity[]> {
        // Fallback for missing posDatafonoTerminal model if not generated, but instructions say models will be available
        const records = (prisma as any).posDatafonoTerminal ? await (prisma as any).posDatafonoTerminal.findMany() : [];
        return records.map((r: any) => this.mapDatafono(r));
    }

    async createDatafonoTerminal(data: Partial<DatafonoTerminalEntity>): Promise<DatafonoTerminalEntity> {
        const id = `dat_${Date.now()}`;
        if (!(prisma as any).posDatafonoTerminal) throw new Error("Datafono model not found in Prisma Client");

        const record = await (prisma as any).posDatafonoTerminal.create({
            data: {
                id,
                companyId: data.companyId || "company_default_pos",
                registerId: data.registerId || "caja_1",
                name: data.name || "Datáfono Smart POS Principal",
                provider: data.provider || "BOLD",
                connectionType: data.connectionType || "BLUETOOTH",
                terminalIp: data.terminalIp,
                bluetoothMac: data.bluetoothMac,
                usbPort: data.usbPort,
                terminalId: data.terminalId || `TERM-${data.provider || 'BOLD'}-01`,
                merchantId: data.merchantId || "MERC-LEGACYMARK-8829",
                hmacSecretKey: data.hmacSecretKey || "legacymark_hmac_secret_key_2026",
                isDefault: data.isDefault ?? true,
                isActive: data.isActive ?? true,
                lastPingStatus: "ONLINE",
                lastPingAt: new Date(),
            }
        });
        return this.mapDatafono(record);
    }

    async updateDatafonoTerminal(id: string, updates: Partial<DatafonoTerminalEntity>): Promise<DatafonoTerminalEntity | null> {
        if (!(prisma as any).posDatafonoTerminal) return null;
        
        const record = await (prisma as any).posDatafonoTerminal.update({
            where: { id },
            data: {
                name: updates.name,
                provider: updates.provider,
                connectionType: updates.connectionType,
                terminalIp: updates.terminalIp,
                terminalId: updates.terminalId,
                merchantId: updates.merchantId,
            }
        });
        return this.mapDatafono(record);
    }

    async deleteDatafonoTerminal(id: string): Promise<boolean> {
        if (!(prisma as any).posDatafonoTerminal) return false;
        await (prisma as any).posDatafonoTerminal.delete({ where: { id } });
        return true;
    }
}
