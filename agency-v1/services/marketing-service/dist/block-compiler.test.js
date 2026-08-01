"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const block_compiler_service_1 = require("./services/block-compiler.service");
(0, vitest_1.describe)("BlockCompilerService - Decoupled Email Content Architecture", () => {
    (0, vitest_1.it)("should compile header, text, image, button, and footer blocks into valid responsive HTML", () => {
        const design = {
            bgColor: "#0f172a",
            cardBgColor: "#1e293b",
            blocks: [
                {
                    type: "header",
                    logoUrl: "https://legacymark.app/logo.png",
                    title: "¡Oferta Especial de Aniversario!",
                    subtitle: "Descuento exclusivo para nuestros clientes VIP"
                },
                {
                    type: "text",
                    content: "<p>Hola {{name}}, nos alegra tenerte en la familia LegacyMark.</p>",
                    color: "#cbd5e1"
                },
                {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
                    alt: "Bono Promocional",
                    width: 500,
                    linkUrl: "https://legacymark.app/promocion"
                },
                {
                    type: "button",
                    label: "Reclamar Descuento",
                    url: "https://legacymark.app/claim",
                    bgColor: "#0d9488"
                },
                {
                    type: "divider",
                    color: "#334155"
                },
                {
                    type: "footer",
                    companyName: "LegacyMark SAS",
                    address: "Calle 100 # 15-20, Bogotá"
                }
            ]
        };
        const compiledHtml = block_compiler_service_1.BlockCompilerService.compileBlocksToHtml(design);
        (0, vitest_1.expect)(compiledHtml).toContain("<!DOCTYPE html>");
        (0, vitest_1.expect)(compiledHtml).toContain("¡Oferta Especial de Aniversario!");
        (0, vitest_1.expect)(compiledHtml).toContain("https://images.unsplash.com/photo-1557804506-669a67965ba0");
        (0, vitest_1.expect)(compiledHtml).toContain("Reclamar Descuento");
        (0, vitest_1.expect)(compiledHtml).toContain("https://legacymark.app/claim");
        (0, vitest_1.expect)(compiledHtml).toContain("LegacyMark SAS");
        (0, vitest_1.expect)(compiledHtml).toContain("<table");
    });
    (0, vitest_1.it)("should compile multi-column block structures correctly", () => {
        const design = {
            blocks: [
                {
                    type: "columns",
                    count: 2,
                    columns: [
                        [{ type: "text", content: "Columna 1" }],
                        [{ type: "button", label: "Acción Col 2", url: "https://example.com" }]
                    ]
                }
            ]
        };
        const html = block_compiler_service_1.BlockCompilerService.compileBlocksToHtml(design);
        (0, vitest_1.expect)(html).toContain("Columna 1");
        (0, vitest_1.expect)(html).toContain("Acción Col 2");
        (0, vitest_1.expect)(html).toContain("column-td");
    });
});
//# sourceMappingURL=block-compiler.test.js.map