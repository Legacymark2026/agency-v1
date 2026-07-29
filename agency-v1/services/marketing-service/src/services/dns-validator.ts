import dns from "dns";

export interface DnsCheckResult {
  domain: string;
  valid: boolean;
  score: number; // 0 to 100
  spf: {
    present: boolean;
    record?: string;
    valid: boolean;
    message: string;
  };
  dkim: {
    present: boolean;
    record?: string;
    valid: boolean;
    message: string;
  };
  dmarc: {
    present: boolean;
    record?: string;
    policy?: string;
    valid: boolean;
    message: string;
  };
  warnings: string[];
}

export class DnsValidatorService {
  /**
   * Diagnosticar registros DNS SPF, DKIM y DMARC de un dominio remitente
   */
  static async checkDomain(domain: string): Promise<DnsCheckResult> {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    const warnings: string[] = [];
    let score = 0;

    // 1. Check SPF
    let spfResult = { present: false, record: undefined as string | undefined, valid: false, message: "Registro SPF no encontrado" };
    try {
      const txtRecords = await dns.promises.resolveTxt(cleanDomain);
      const flatRecords = txtRecords.map((r) => r.join(""));
      const spfRecord = flatRecords.find((r) => r.startsWith("v=spf1"));

      if (spfRecord) {
        spfResult.present = true;
        spfResult.record = spfRecord;
        spfResult.valid = true;
        spfResult.message = "Registro SPF válido configurado";
        score += 35;
      } else {
        warnings.push("Falta el registro SPF (v=spf1). Los correos pueden ser rechazados o marcados como SPAM por Gmail/Outlook.");
      }
    } catch (err: any) {
      warnings.push(`Error consultando registros TXT de SPF: ${err.message}`);
    }

    // 2. Check DMARC
    let dmarcResult = { present: false, record: undefined as string | undefined, policy: undefined as string | undefined, valid: false, message: "Registro DMARC no encontrado" };
    try {
      const dmarcDomain = `_dmarc.${cleanDomain}`;
      const txtRecords = await dns.promises.resolveTxt(dmarcDomain);
      const flatRecords = txtRecords.map((r) => r.join(""));
      const dmarcRecord = flatRecords.find((r) => r.startsWith("v=DMARC1"));

      if (dmarcRecord) {
        dmarcResult.present = true;
        dmarcResult.record = dmarcRecord;
        dmarcResult.valid = true;
        const pMatch = dmarcRecord.match(/p=(none|quarantine|reject)/i);
        dmarcResult.policy = pMatch ? pMatch[1] : "none";
        dmarcResult.message = `Registro DMARC configurado con política p=${dmarcResult.policy}`;
        score += 35;
      } else {
        warnings.push("Falta el registro DMARC (_dmarc). Google y Yahoo requieren DMARC desde 2024.");
      }
    } catch (err: any) {
      warnings.push(`DMARC no detectado en _dmarc.${cleanDomain}`);
    }

    // 3. Check DKIM (Check common selector resend._domainkey, default._domainkey, or google._domainkey)
    let dkimResult = { present: false, record: undefined as string | undefined, valid: false, message: "Registro DKIM no detectado en selectores comunes" };
    const selectors = ["resend", "default", "google", "k1", "smtp"];
    for (const selector of selectors) {
      try {
        const dkimDomain = `${selector}._domainkey.${cleanDomain}`;
        const txtRecords = await dns.promises.resolveTxt(dkimDomain);
        const flatRecords = txtRecords.map((r) => r.join(""));
        const dkimRecord = flatRecords.find((r) => r.includes("v=DKIM1") || r.includes("k=rsa") || r.includes("p="));

        if (dkimRecord) {
          dkimResult.present = true;
          dkimResult.record = dkimRecord;
          dkimResult.valid = true;
          dkimResult.message = `Registro DKIM válido detectado en selector '${selector}'`;
          score += 30;
          break;
        }
      } catch {}
    }

    if (!dkimResult.present) {
      warnings.push("No se encontró firma DKIM en selectores estándares. Verifica la configuración con tu proveedor de email.");
    }

    return {
      domain: cleanDomain,
      valid: score >= 65,
      score,
      spf: spfResult,
      dkim: dkimResult,
      dmarc: dmarcResult,
      warnings
    };
  }
}
