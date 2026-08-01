import { VariableContext } from "./variable-parser.service";
export type BlockType = "header" | "text" | "image" | "button" | "divider" | "columns" | "social" | "footer" | "hero_banner" | "product_card" | "testimonial" | "coupon_code";
export interface HeroBannerBlock {
    type: "hero_banner";
    imageUrl: string;
    headline: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    overlayColor?: string;
}
export interface ProductCardBlock {
    type: "product_card";
    imageUrl: string;
    title: string;
    price: string;
    originalPrice?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
}
export interface TestimonialBlock {
    type: "testimonial";
    quote: string;
    authorName: string;
    authorTitle?: string;
    avatarUrl?: string;
}
export interface CouponCodeBlock {
    type: "coupon_code";
    code: string;
    discountText: string;
    expiresText?: string;
    buttonText?: string;
    buttonUrl?: string;
}
export interface HeaderBlock {
    type: "header";
    logoUrl?: string;
    title: string;
    subtitle?: string;
    align?: "left" | "center" | "right";
    bgColor?: string;
    textColor?: string;
}
export interface TextBlock {
    type: "text";
    content: string;
    fontSize?: number;
    color?: string;
    align?: "left" | "center" | "right" | "justify";
    padding?: number;
}
export interface ImageBlock {
    type: "image";
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    align?: "left" | "center" | "right";
    linkUrl?: string;
    borderRadius?: number;
}
export interface ButtonBlock {
    type: "button";
    label: string;
    url: string;
    bgColor?: string;
    textColor?: string;
    align?: "left" | "center" | "right";
    borderRadius?: number;
    fontSize?: number;
    paddingY?: number;
    paddingX?: number;
}
export interface DividerBlock {
    type: "divider";
    color?: string;
    thickness?: number;
    margin?: number;
}
export interface ColumnsBlock {
    type: "columns";
    count: 2 | 3;
    columns: EmailBlock[][];
}
export interface SocialLink {
    platform: "facebook" | "instagram" | "x" | "linkedin" | "website" | "youtube";
    url: string;
}
export interface SocialBlock {
    type: "social";
    align?: "left" | "center" | "right";
    links: SocialLink[];
}
export interface FooterBlock {
    type: "footer";
    companyName: string;
    address?: string;
    unsubscribeUrl?: string;
    textColor?: string;
}
export type EmailBlock = HeaderBlock | TextBlock | ImageBlock | ButtonBlock | DividerBlock | ColumnsBlock | SocialBlock | FooterBlock | HeroBannerBlock | ProductCardBlock | TestimonialBlock | CouponCodeBlock;
export interface EmailDesignJson {
    id?: string;
    bgColor?: string;
    cardBgColor?: string;
    fontFamily?: string;
    maxWidth?: number;
    blocks: EmailBlock[];
}
export declare class BlockCompilerService {
    /**
     * Compilar un objeto EmailDesignJson a HTML responsive con caché Redis de alto tráfico
     */
    static compileBlocksToHtmlWithCache(design: EmailDesignJson, variablesContext?: VariableContext): Promise<string>;
    /**
     * Compilar un objeto EmailDesignJson a HTML responsive
     */
    static compileBlocksToHtml(design: EmailDesignJson): string;
    private static renderBlock;
}
