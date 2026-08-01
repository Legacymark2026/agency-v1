import { EmailDesignJson } from "./block-compiler.service";
export interface BlogArticleItem {
    title: string;
    excerpt: string;
    url: string;
    imageUrl?: string;
    publishedAt?: string;
}
export declare class RssAutomationService {
    /**
     * Generar plantilla de boletín de noticias automáticamente a partir de artículos del Blog / RSS
     */
    static generateNewsletterFromArticles(companyName: string, articles: BlogArticleItem[]): {
        designJson: EmailDesignJson;
        compiledHtml: string;
    };
}
