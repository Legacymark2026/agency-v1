import { describe, it, expect } from "vitest";
import { BlockCompilerService, EmailDesignJson } from "./services/block-compiler.service";

describe("BlockCompilerService - Decoupled Email Content Architecture", () => {
  it("should compile header, text, image, button, and footer blocks into valid responsive HTML", () => {
    const design: EmailDesignJson = {
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

    const compiledHtml = BlockCompilerService.compileBlocksToHtml(design);

    expect(compiledHtml).toContain("<!DOCTYPE html>");
    expect(compiledHtml).toContain("¡Oferta Especial de Aniversario!");
    expect(compiledHtml).toContain("https://images.unsplash.com/photo-1557804506-669a67965ba0");
    expect(compiledHtml).toContain("Reclamar Descuento");
    expect(compiledHtml).toContain("https://legacymark.app/claim");
    expect(compiledHtml).toContain("LegacyMark SAS");
    expect(compiledHtml).toContain("<table");
  });

  it("should compile multi-column block structures correctly", () => {
    const design: EmailDesignJson = {
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

    const html = BlockCompilerService.compileBlocksToHtml(design);

    expect(html).toContain("Columna 1");
    expect(html).toContain("Acción Col 2");
    expect(html).toContain("column-td");
  });
});
