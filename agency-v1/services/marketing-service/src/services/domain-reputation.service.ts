import dns from 'dns';
import util from 'util';
import { prisma } from '@agency/database';

export class DomainReputationService {
  /**
   * Verificar dominio contra blacklists DNS conocidas
   */
  static async checkBlacklists(domain: string): Promise<{ blacklist: string; listed: boolean }[]> {
    const blacklists = [
      'zen.spamhaus.org',
      'bl.spamcop.net',
      'b.barracudacentral.org',
      'dnsbl.sorbs.net'
    ];
    
    const results: { blacklist: string; listed: boolean }[] = [];
    
    try {
      const addresses = await dns.promises.resolve4(domain);
      if (addresses.length > 0) {
        const ip = addresses[0];
        const reversedIp = ip.split('.').reverse().join('.');
        
        for (const bl of blacklists) {
          try {
            const query = `${reversedIp}.${bl}`;
            await dns.promises.resolve4(query);
            results.push({ blacklist: bl, listed: true });
          } catch (e) {
            results.push({ blacklist: bl, listed: false });
          }
        }
      } else {
        blacklists.forEach(bl => results.push({ blacklist: bl, listed: false }));
      }
    } catch (error) {
      blacklists.forEach(bl => results.push({ blacklist: bl, listed: false }));
    }
    
    return results;
  }

  /**
   * Verificar registros DMARC, DKIM y SPF
   */
  static async checkDmarcDkimSpf(domain: string) {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    
    let dmarcValid = false;
    let spfValid = false;
    let dkimValid = false;
    
    // SPF
    try {
      const txtRecords = await dns.promises.resolveTxt(cleanDomain);
      const flatRecords = txtRecords.map((r) => r.join(""));
      spfValid = flatRecords.some((r) => r.startsWith("v=spf1"));
    } catch (e) {}

    // DMARC
    try {
      const txtRecords = await dns.promises.resolveTxt(`_dmarc.${cleanDomain}`);
      const flatRecords = txtRecords.map((r) => r.join(""));
      dmarcValid = flatRecords.some((r) => r.startsWith("v=DMARC1"));
    } catch (e) {}

    // DKIM
    try {
      const txtRecords = await dns.promises.resolveTxt(`_domainkey.${cleanDomain}`);
      const flatRecords = txtRecords.map((r) => r.join(""));
      dkimValid = flatRecords.some((r) => r.includes("v=DKIM1") || r.includes("k=rsa"));
    } catch (e) {}

    return {
      dmarcValid,
      spfValid,
      dkimValid
    };
  }

  /**
   * Calcular puntuación de remitente 0-100
   */
  static async getSenderScore(companyId: string) {
    const bounceRate = 0.01;
    const complaintRate = 0.0005;
    
    let score = 100;
    
    if (bounceRate >= 0.05) score -= 30;
    else if (bounceRate >= 0.02) score -= 10;
    
    if (complaintRate >= 0.005) score -= 40;
    else if (complaintRate >= 0.001) score -= 20;
    
    const domain = 'example.com';
    const auth = await this.checkDmarcDkimSpf(domain);
    if (!auth.spfValid) score -= 15;
    if (!auth.dkimValid) score -= 15;
    if (!auth.dmarcValid) score -= 10;
    
    const blacklists = await this.checkBlacklists(domain);
    const listedCount = blacklists.filter(b => b.listed).length;
    score -= (listedCount * 25);
    
    return Math.max(0, score);
  }

  /**
   * Generar horario de calentamiento de dominio
   */
  static getDomainWarmupSchedule(domain: string, dailyTarget: number) {
    const schedule: any[] = [];
    let currentAmount = 50;
    
    for (let day = 1; day <= 14; day++) {
      schedule.push({
        day,
        volume: Math.min(currentAmount, dailyTarget),
        domain
      });
      
      if (currentAmount >= dailyTarget) {
        currentAmount = dailyTarget;
      } else {
        currentAmount *= 2;
      }
    }
    
    return schedule;
  }

  /**
   * Combinar todas las verificaciones en un reporte completo
   */
  static async getFullReputationReport(domain: string, companyId: string) {
    const blacklists = await this.checkBlacklists(domain);
    const auth = await this.checkDmarcDkimSpf(domain);
    const score = await this.getSenderScore(companyId);
    
    return {
      domain,
      companyId,
      score,
      auth,
      blacklists,
      timestamp: new Date().toISOString()
    };
  }
}
