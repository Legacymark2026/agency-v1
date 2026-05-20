/**
 * Credit System - The "Gasolina" de Credits
 * Sistema de créditos por empresa
 */
import { getDatabase } from '../db-client';
function getDb() {
    const db = getDatabase();
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() from the main app first.');
    }
    return db;
}
// ============================================
// GESTOR DE CRÉDITOS
// ============================================
export class CreditManager {
    /**
     * Obtiene el balance de créditos de una empresa
     */
    static async getBalance(companyId) {
        var _a, _b;
        const db = getDb();
        const config = await db.integrationConfig.findUnique({
            where: { companyId_provider: { companyId, provider: 'credits' } }
        });
        const credits = ((_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.credits) || 0;
        const used = ((_b = config === null || config === void 0 ? void 0 : config.config) === null || _b === void 0 ? void 0 : _b.usedCredits) || 0;
        return {
            companyId,
            totalCredits: credits,
            usedCredits: used,
            availableCredits: credits - used,
            lastUpdated: new Date()
        };
    }
    /**
     * Verifica si hay suficientes créditos
     */
    static async hasEnoughCredits(companyId, amount) {
        const balance = await this.getBalance(companyId);
        return balance.availableCredits >= amount;
    }
    /**
     * Consume créditos
     */
    static async consumeCredits(companyId, amount, action, projectId) {
        var _a;
        // Verificar balance
        const hasEnough = await this.hasEnoughCredits(companyId, amount);
        if (!hasEnough) {
            return {
                success: false,
                error: 'Credits insuficientes. Por favor compra más créditos.'
            };
        }
        try {
            const db = getDb();
            // Obtener config actual
            const config = await db.integrationConfig.findUnique({
                where: { companyId_provider: { companyId, provider: 'credits' } }
            });
            const currentUsed = ((_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.usedCredits) || 0;
            const newUsed = currentUsed + amount;
            // Actualizar
            await db.integrationConfig.upsert({
                where: {
                    companyId_provider: { companyId, provider: 'credits' }
                },
                update: {
                    config: Object.assign(Object.assign({}, ((config === null || config === void 0 ? void 0 : config.config) || {})), { usedCredits: newUsed })
                },
                create: {
                    companyId,
                    provider: 'credits',
                    config: {
                        credits: 1000, // Default
                        usedCredits: amount
                    }
                }
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Agrega créditos a una empresa
     */
    static async addCredits(companyId, amount, paymentId) {
        var _a;
        try {
            const db = getDb();
            const config = await db.integrationConfig.findUnique({
                where: { companyId_provider: { companyId, provider: 'credits' } }
            });
            const currentCredits = ((_a = config === null || config === void 0 ? void 0 : config.config) === null || _a === void 0 ? void 0 : _a.credits) || 0;
            const newCredits = currentCredits + amount;
            await db.integrationConfig.upsert({
                where: {
                    companyId_provider: { companyId, provider: 'credits' }
                },
                update: {
                    config: Object.assign(Object.assign({}, ((config === null || config === void 0 ? void 0 : config.config) || {})), { credits: newCredits, lastPurchase: new Date(), paymentId })
                },
                create: {
                    companyId,
                    provider: 'credits',
                    config: {
                        credits: amount,
                        usedCredits: 0,
                        lastPurchase: new Date(),
                        paymentId
                    }
                }
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Obtiene historial de uso
     */
    static async getUsageHistory(companyId, limit = 50) {
        // En producción, guardarías esto en una tabla separada
        // Por ahora retornamos array vacío
        return [];
    }
    /**
     * Calcula costo estimado de una operación
     */
    static calculateCost(provider, operation) {
        const costs = {
            'midjourney-generate': 5,
            'dalle-generate': 3,
            'pexels-search': 1,
            'adobe-stock-download': 2,
            'elevenlabs-tts': 3,
            'suno-generate': 10,
            'runway-generate': 20,
            'luma-generate': 18,
            'sora-generate': 25
        };
        return costs[`${provider}-${operation}`] || 1;
    }
}
export default CreditManager;
