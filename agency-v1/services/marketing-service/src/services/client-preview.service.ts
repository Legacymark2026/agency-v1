export interface ClientCompatibilityReport {
  client: string;
  supportLevel: "EXCELLENT" | "GOOD" | "WARNING";
  score: number;
  warnings: string[];
}

export class ClientPreviewService {
  /**
   * Analizar marcado HTML y generar reporte de compatibilidad por cliente de correo
   */
  static analyzeCompatibility(html: string): ClientCompatibilityReport[] {
    const reports: ClientCompatibilityReport[] = [];

    // Gmail Analysis
    const gmailWarnings: string[] = [];
    if (html.includes("<style>") && !html.includes("max-width")) {
      gmailWarnings.push("Se recomienda definir max-width explícito para evitar desbordes en Gmail App.");
    }
    if (html.includes("position: absolute")) {
      gmailWarnings.push("Gmail elimina la propiedad CSS 'position: absolute'. Usa tablas responsive.");
    }
    reports.push({
      client: "Gmail (Web / iOS / Android)",
      supportLevel: gmailWarnings.length === 0 ? "EXCELLENT" : "GOOD",
      score: gmailWarnings.length === 0 ? 100 : 90,
      warnings: gmailWarnings
    });

    // Outlook Analysis
    const outlookWarnings: string[] = [];
    if (!html.includes("<!--[if mso]>")) {
      outlookWarnings.push("Faltan comentarios de compatibilidad MSO <!--[if mso]> para botones y bordes en Outlook Desktop.");
    }
    if (html.includes("border-radius") && !html.includes("v:roundrect")) {
      outlookWarnings.push("Outlook 2016-2021 ignora border-radius CSS. Requiere marcado VML.");
    }
    reports.push({
      client: "Microsoft Outlook (Desktop 2016-2021)",
      supportLevel: outlookWarnings.length === 0 ? "EXCELLENT" : "WARNING",
      score: outlookWarnings.length === 0 ? 100 : 75,
      warnings: outlookWarnings
    });

    // Apple Mail Analysis
    reports.push({
      client: "Apple Mail (iOS / macOS)",
      supportLevel: "EXCELLENT",
      score: 100,
      warnings: []
    });

    return reports;
  }
}
