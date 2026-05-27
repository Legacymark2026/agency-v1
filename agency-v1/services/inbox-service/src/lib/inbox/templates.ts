/**
 * Templates helper (P1 #6)
 *
 * Support for rendering Handlebars templates
 */

import Handlebars from "handlebars";
import { logger } from "./logger";

/**
 * Compila y renderiza template con contexto
 */
export function renderTemplate(
  template: string,
  context: Record<string, any>
): string {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(context);
  } catch (error) {
    logger.error("[Templates] Error rendering template", {
      error: error instanceof Error ? error.message : String(error),
      templatePreview: template.substring(0, 100),
    });
    // Fallback: return template as-is if compilation fails
    return template;
  }
}

/**
 * Valida syntax de template antes de guardar
 */
export function validateTemplateSync(template: string): { isValid: boolean; errors: string[] } {
  try {
    Handlebars.compile(template);
    return { isValid: true, errors: [] };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Registra helpers customizados
 */
export function registerTemplateHelpers() {
  // Formato de moneda
  Handlebars.registerHelper("formatCurrency", (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(value);
  });

  // Formateo de fecha
  Handlebars.registerHelper("formatDate", (date: Date, format: string = "short") => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (format === "short") {
        return d.toLocaleDateString("es-CO");
      }
      return d.toISOString();
    } catch {
      return "";
    }
  });

  // Condicional equals
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);

  // Condicional not equals
  Handlebars.registerHelper("ne", (a: any, b: any) => a !== b);

  // Operaciones matemáticas
  Handlebars.registerHelper("add", (a: number, b: number) => a + b);

  // Truncar strings
  Handlebars.registerHelper("truncate", (str: string, length: number = 50) => {
    if (str.length > length) {
      return str.substring(0, length) + "...";
    }
    return str;
  });

  // Capitalize
  Handlebars.registerHelper("capitalize", (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });
}

/**
 * Contexto template pre-definido para inbox macros
 */
export function buildMacroTemplateContext(data: {
  lead?: any;
  deal?: any;
  conversation?: any;
  user?: any;
  company?: any;
}) {
  registerTemplateHelpers();

  return {
    lead: {
      name: data.lead?.name || "",
      email: data.lead?.email || "",
      phone: data.lead?.phone || "",
      company: data.lead?.company || "",
    },
    deal: {
      id: data.deal?.id || "",
      title: data.deal?.title || "",
      value: data.deal?.amount || 0,
      stage: data.deal?.stage || "",
    },
    conversation: {
      id: data.conversation?.id || "",
      channel: data.conversation?.channel || "",
      status: data.conversation?.status || "",
    },
    user: {
      name: data.user?.name || "",
      email: data.user?.email || "",
      phone: data.user?.phone || "",
    },
    company: {
      name: data.company?.name || "",
      website: data.company?.website || "",
    },
    date: new Date(),
    now: new Date(),
  };
}
