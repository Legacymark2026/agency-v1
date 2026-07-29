export interface VariableContext {
  name?: string;
  email?: string;
  companyName?: string;
  discountCode?: string;
  unsubscribeLink?: string;
  [key: string]: any;
}

export class VariableParserService {
  private static DEFAULT_CONTEXT: VariableContext = {
    name: "Cliente VIP",
    email: "cliente@ejemplo.com",
    companyName: "Tu Empresa SAS",
    discountCode: "PROMO2026",
    unsubscribeLink: "https://legacymarksas.com/unsubscribe?demo=1"
  };

  /**
   * Parsear e interpolar variables dinámicas {{variable}} en cadenas de texto o marcado HTML
   */
  static parseVariables(templateText: string, context: VariableContext = {}): string {
    if (!templateText) return "";

    const mergedContext = { ...this.DEFAULT_CONTEXT, ...context };

    return templateText.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_match, key) => {
      const value = this.getNestedValue(mergedContext, key);
      return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
    });
  }

  private static getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }
}
