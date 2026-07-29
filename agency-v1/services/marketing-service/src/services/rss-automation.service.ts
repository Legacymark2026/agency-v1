import { BlockCompilerService, EmailDesignJson } from "./block-compiler.service";

export interface BlogArticleItem {
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
}

export class RssAutomationService {
  /**
   * Generar plantilla de boletín de noticias automáticamente a partir de artículos del Blog / RSS
   */
  static generateNewsletterFromArticles(
    companyName: string,
    articles: BlogArticleItem[]
  ): { designJson: EmailDesignJson; compiledHtml: string } {
    const blocks: any[] = [
      {
        type: "header",
        title: `Boletín de Noticias — ${companyName}`,
        subtitle: "Últimas novedades y artículos destacados"
      }
    ];

    if (articles.length > 0) {
      const topArticle = articles[0];
      blocks.push({
        type: "hero_banner",
        imageUrl: topArticle.imageUrl || "https://images.unsplash.com/photo-1557804506-669a67965ba0",
        headline: topArticle.title,
        subheadline: topArticle.excerpt,
        ctaText: "Leer Artículo Completo",
        ctaUrl: topArticle.url
      });
    }

    const secondaryArticles = articles.slice(1, 4);
    secondaryArticles.forEach((art) => {
      blocks.push({
        type: "product_card",
        imageUrl: art.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        title: art.title,
        description: art.excerpt,
        buttonText: "Leer Más",
        buttonUrl: art.url
      });
    });

    blocks.push({
      type: "footer",
      companyName,
      unsubscribeUrl: "{{unsubscribeLink}}"
    });

    const designJson: EmailDesignJson = {
      bgColor: "#0f172a",
      cardBgColor: "#1e293b",
      blocks
    };

    const compiledHtml = BlockCompilerService.compileBlocksToHtml(designJson);

    return { designJson, compiledHtml };
  }
}
