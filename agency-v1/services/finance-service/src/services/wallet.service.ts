import { getPrismaCore } from "@agency/database";

export class WalletService {
  /**
   * Obtiene o inicializa el balance del Wallet prepago de una empresa
   */
  static async getWalletBalance(companyId: string) {
    const prisma = getPrismaCore();
    let wallet = await (prisma as any).companyWallet.findUnique({
      where: { companyId }
    });

    if (!wallet) {
      wallet = await (prisma as any).companyWallet.create({
        data: {
          companyId,
          balanceUsd: 50.0, // Créditos iniciales de prueba ($50 USD)
          autoRechargeEnabled: false,
          autoRechargeThreshold: 10.0,
          autoRechargeAmount: 50.0,
          currency: "USD"
        }
      });
    }

    return wallet;
  }

  /**
   * Recarga saldo al Wallet prepago de una empresa
   */
  static async rechargeWallet(companyId: string, amountUsd: number) {
    const prisma = getPrismaCore();
    const current = await this.getWalletBalance(companyId);

    const updated = await (prisma as any).companyWallet.update({
      where: { companyId },
      data: {
        balanceUsd: (current.balanceUsd || 0) + amountUsd
      }
    });

    return updated;
  }

  /**
   * Configura las opciones de auto-recarga del Wallet
   */
  static async updateAutoRechargeConfig(companyId: string, enabled: boolean, threshold: number, amount: number) {
    const prisma = getPrismaCore();
    await this.getWalletBalance(companyId);

    const updated = await (prisma as any).companyWallet.update({
      where: { companyId },
      data: {
        autoRechargeEnabled: enabled,
        autoRechargeThreshold: threshold,
        autoRechargeAmount: amount,
      }
    });

    return updated;
  }
}
