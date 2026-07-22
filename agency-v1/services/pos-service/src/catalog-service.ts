/**
 * Catalog Microservice Module — High Level Domain Service & Event Publisher
 */
import { EventBus } from "@agency/events";
import { IsolatedCatalogRepository, CatalogEntity } from "./catalog-repository";

export type CatalogProduct = CatalogEntity;

export class CatalogService {
    private repository: IsolatedCatalogRepository;

    constructor(eventBus: EventBus) {
        this.repository = new IsolatedCatalogRepository(eventBus);
    }

    getRepository(): IsolatedCatalogRepository {
        return this.repository;
    }

    async getProducts(params: { companyId?: string; category?: string; search?: string; activeOnly?: boolean }): Promise<CatalogProduct[]> {
        return this.repository.findAll({
            category: params.category,
            search: params.search,
        });
    }

    async getProductById(idOrSku: string): Promise<CatalogProduct | null> {
        return this.repository.findByIdOrSku(idOrSku);
    }

    async createProduct(data: Omit<CatalogProduct, "id" | "createdAt" | "updatedAt">): Promise<CatalogProduct> {
        return this.repository.create(data);
    }

    async updateProduct(id: string, updates: Partial<CatalogProduct>): Promise<CatalogProduct | null> {
        return this.repository.update(id, updates);
    }

    async adjustStock(productId: string, deltaQty: number, reason: string): Promise<CatalogProduct | null> {
        return this.repository.adjustStock(productId, deltaQty, reason);
    }

    async deleteProduct(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}
