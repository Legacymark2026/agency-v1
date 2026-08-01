"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const block_compiler_service_1 = require("./services/block-compiler.service");
const variable_parser_service_1 = require("./services/variable-parser.service");
(0, vitest_1.describe)("Template Editor & Variable Parser Engine", () => {
    (0, vitest_1.it)("should parse dynamic variables correctly with custom context and default fallbacks", () => {
        const rawTemplate = "¡Hola {{name}}! Tu código en {{companyName}} es {{discountCode}}.";
        const parsed = variable_parser_service_1.VariableParserService.parseVariables(rawTemplate, {
            name: "Alejandro",
            companyName: "LegacyMark Corp",
            discountCode: "AGENCY2026"
        });
        (0, vitest_1.expect)(parsed).toBe("¡Hola Alejandro! Tu código en LegacyMark Corp es AGENCY2026.");
    });
    (0, vitest_1.it)("should compile HeroBanner, ProductCard and CouponCode blocks to responsive email HTML", async () => {
        const design = {
            id: "template-test-101",
            blocks: [
                {
                    type: "hero_banner",
                    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
                    headline: "¡Oferta Aniversario {{name}}!",
                    subheadline: "Descuento especial para {{companyName}}",
                    ctaText: "Ver Oferta",
                    ctaUrl: "https://legacymarksas.com"
                },
                {
                    type: "coupon_code",
                    code: "{{discountCode}}",
                    discountText: "Cupón VIP Exclusivo",
                    expiresText: "Válido 48 horas"
                },
                {
                    type: "product_card",
                    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
                    title: "Plan Pro Enterprise",
                    price: "$199 USD",
                    originalPrice: "$299 USD",
                    buttonText: "Comprar Ahora"
                }
            ]
        };
        const compiledHtml = await block_compiler_service_1.BlockCompilerService.compileBlocksToHtmlWithCache(design, {
            name: "Sofía",
            companyName: "TechCorp",
            discountCode: "SOFIA2026"
        });
        (0, vitest_1.expect)(compiledHtml).toContain("¡Oferta Aniversario Sofía!");
        (0, vitest_1.expect)(compiledHtml).toContain("Descuento especial para TechCorp");
        (0, vitest_1.expect)(compiledHtml).toContain("SOFIA2026");
        (0, vitest_1.expect)(compiledHtml).toContain("Plan Pro Enterprise");
        (0, vitest_1.expect)(compiledHtml).toContain("$199 USD");
    });
});
//# sourceMappingURL=template-editor.test.js.map