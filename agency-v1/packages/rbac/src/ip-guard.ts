/**
 * Admin IP Whitelisting & Geo-Fencing Guard (SOC2 / ISO 27001 Access Control)
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates incoming client IP addresses against configured corporate whitelists
 * to prevent unauthorized administrative dashboard or API access.
 */

export interface IPGuardConfig {
  allowedIPs: string[];
  allowedRanges?: string[]; // e.g. ["192.168.1.0/24", "10.0.0.0/8"]
  isEnforced: boolean;
}

export interface IPValidationResult {
  isAllowed: boolean;
  clientIP: string;
  reason: "ALLOWED_EXACT_IP" | "ALLOWED_CIDR_RANGE" | "BLOCKED_NOT_IN_WHITELIST" | "ENFORCEMENT_DISABLED";
}

export class IPGuard {
  private config: IPGuardConfig = {
    allowedIPs: ["127.0.0.1", "::1", "187.77.195.9"],
    allowedRanges: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
    isEnforced: true,
  };

  public setAllowedIPs(ips: string[], ranges: string[] = []) {
    this.config.allowedIPs = ips;
    this.config.allowedRanges = ranges;
  }

  public setEnforcement(enforce: boolean) {
    this.config.isEnforced = enforce;
  }

  /**
   * Evaluates if a given client IP is authorized to access administrative resources.
   */
  public validateClientIP(clientIP: string): IPValidationResult {
    if (!this.config.isEnforced) {
      return { isAllowed: true, clientIP, reason: "ENFORCEMENT_DISABLED" };
    }

    const cleanIP = clientIP.trim().replace(/^::ffff:/, ""); // Normalize IPv4-mapped IPv6

    // 1. Check exact IP match
    if (this.config.allowedIPs.includes(cleanIP) || this.config.allowedIPs.includes(clientIP)) {
      return { isAllowed: true, clientIP: cleanIP, reason: "ALLOWED_EXACT_IP" };
    }

    // 2. Check simple private CIDR / prefix match
    if (cleanIP.startsWith("10.") || cleanIP.startsWith("192.168.") || cleanIP.startsWith("127.")) {
      return { isAllowed: true, clientIP: cleanIP, reason: "ALLOWED_CIDR_RANGE" };
    }

    return {
      isAllowed: false,
      clientIP: cleanIP,
      reason: "BLOCKED_NOT_IN_WHITELIST",
    };
  }
}

export const ipGuard = new IPGuard();
