"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const database_1 = require("@agency/database");
class WalletService {
    /**
     * Obtiene o inicializa el balance del Wallet prepago de una empresa
     */
    static async getWalletBalance(companyId) {
        const prisma = (0, database_1.getPrismaCore)();
        let wallet = await prisma.companyWallet.findUnique({
            where: { companyId }
        });
        if (!wallet) {
            wallet = await prisma.companyWallet.create({
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
    static async rechargeWallet(companyId, amountUsd) {
        const prisma = (0, database_1.getPrismaCore)();
        const current = await this.getWalletBalance(companyId);
        const updated = await prisma.companyWallet.update({
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
    static async updateAutoRechargeConfig(companyId, enabled, threshold, amount) {
        const prisma = (0, database_1.getPrismaCore)();
        await this.getWalletBalance(companyId);
        const updated = await prisma.companyWallet.update({
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
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map