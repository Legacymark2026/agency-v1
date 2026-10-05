/**
 * apps/web/lib/client-fingerprint.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Extrae señales deterministas del hardware del navegador en el cliente (Zero-Cost)
 * para alimentar los motores de Anti-Abuse y Detección de Bots.
 */

export interface ClientDeviceSignals {
  canvasHash?: string;
  webglRenderer?: string;
  audioHash?: string;
  screenResolution?: string;
  cpuCores?: number;
  timezone?: string;
  platform?: string;
  language?: string;
  userAgent?: string;
  isWebDriver?: boolean;
}

export function getClientDeviceSignals(): ClientDeviceSignals {
  if (typeof window === "undefined") return {};

  const signals: ClientDeviceSignals = {
    screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    cpuCores: navigator.hardwareConcurrency || 2,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    platform: navigator.platform || "unknown",
    language: navigator.language || "es",
    userAgent: navigator.userAgent || "",
    isWebDriver: Boolean((navigator as any).webdriver),
  };

  // Canvas Fingerprint básico
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(10, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("LegacyMark-SaaS-Security-2026", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("LegacyMark-SaaS-Security-2026", 4, 17);
      signals.canvasHash = canvas.toDataURL().slice(-64);
    }
  } catch {
    // Ignorar si el navegador bloquea canvas
  }

  // WebGL Unmasked Renderer
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as any);
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        signals.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      }
    }
  } catch {
    // Ignorar si WebGL está deshabilitado
  }

  return signals;
}

export async function computeClientDeviceHash(signals: ClientDeviceSignals): Promise<string> {
  const payload = [
    signals.canvasHash || "no-canvas",
    signals.webglRenderer || "no-webgl",
    signals.screenResolution || "no-res",
    String(signals.cpuCores || 0),
    signals.timezone || "UTC",
    signals.platform || "unknown",
    (signals.language || "es").toLowerCase().slice(0, 2),
    (signals.userAgent || "generic").trim().toLowerCase().slice(0, 120),
  ].join("|");

  try {
    const msgBuffer = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}
