import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export class EmailValidatorService {
  private static disposableDomains = new Set([
      'guerrillamail.com', 'tempmail.com', 'throwaway.com', 'mailinator.com', 'yopmail.com',
      '10minutemail.com', 'dispostable.com', 'sharklasers.com', 'tempmail.net'
  ]);

  /**
   * Verificar dominio desechable
   */
  static isDisposableDomain(domain: string): boolean {
      return this.disposableDomains.has(domain.toLowerCase());
  }

  /**
   * Obtener registro MX
   */
  static async getMxRecord(domain: string): Promise<boolean> {
      try {
          const records = await resolveMx(domain);
          return records && records.length > 0;
      } catch (e) {
          return false;
      }
  }

  /**
   * Validar email (formato, desechable, MX)
   */
  static async validateEmail(email: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          return { isValid: false, isDisposable: false, hasMx: false, error: 'Invalid format' };
      }

      const domain = email.split('@')[1];
      const isDisposable = this.isDisposableDomain(domain);
      const hasMx = await this.getMxRecord(domain);

      return {
          isValid: !isDisposable && hasMx,
          isDisposable,
          hasMx,
          error: !hasMx ? 'No MX record' : (isDisposable ? 'Disposable domain' : null)
      };
  }

  /**
   * Validar lote
   */
  static async validateBatch(emails: string[]) {
      const valid: string[] = [];
      const invalid: string[] = [];
      const disposable: string[] = [];

      for (const email of emails) {
          const res = await this.validateEmail(email);
          if (res.isDisposable) {
              disposable.push(email);
          } else if (res.isValid) {
              valid.push(email);
          } else {
              invalid.push(email);
          }
      }

      return {
          valid,
          invalid,
          disposable,
          score: this.getListQualityScore({ valid: valid.length, invalid: invalid.length, disposable: disposable.length })
      };
  }

  /**
   * Calcular score de calidad de la lista (0-100)
   */
  static getListQualityScore(results: { valid: number; invalid: number; disposable: number }): number {
      const total = results.valid + results.invalid + results.disposable;
      if (total === 0) return 0;

      const validPercent = (results.valid / total) * 100;
      const penalty = (results.disposable / total) * 50 + (results.invalid / total) * 20;

      return Math.max(0, Math.min(100, validPercent - penalty));
  }
}
