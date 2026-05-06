/**
 * Credit System - The "Gasolina" de Credits
 * Sistema de créditos por empresa
 */

import { prisma } from '@/lib/prisma';

export interface CreditInfo {
  companyId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  lastUpdated: Date;
}

export interface CreditUsage {
  companyId: string;
  action: string;
  amount: number;
  cost: number;
  projectId?: string;
  status: 'pending' | 'completed' | 'refunded';
}

// ============================================
// GESTOR DE CRÉDITOS
// ============================================

export class CreditManager {
  /**
   * Obtiene el balance de créditos de una empresa
   */
  static async getBalance(companyId: string): Promise<CreditInfo> {
    const config = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'credits' } }
    });

    const credits = (config?.config as any)?.credits || 0;
    const used = (config?.config as any)?.usedCredits || 0;

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
  static async hasEnoughCredits(companyId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(companyId);
    return balance.availableCredits >= amount;
  }

  /**
   * Consume créditos
   */
  static async consumeCredits(
    companyId: string,
    amount: number,
    action: string,
    projectId?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verificar balance
    const hasEnough = await this.hasEnoughCredits(companyId, amount);
    if (!hasEnough) {
      return { 
        success: false, 
        error: 'Credits insuficientes. Por favor compra más créditos.' 
      };
    }

    try {
      // Obtener config actual
      const config = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider: 'credits' } }
      });

      const currentUsed = (config?.config as any)?.usedCredits || 0;
      const newUsed = currentUsed + amount;

      // Actualizar
      await prisma.integrationConfig.upsert({
        where: {
          companyId_provider: { companyId, provider: 'credits' }
        },
        update: {
          config: {
            ...(config?.config as object || {}),
            usedCredits: newUsed
          }
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Agrega créditos a una empresa
   */
  static async addCredits(
    companyId: string,
    amount: number,
    paymentId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await prisma.integrationConfig.findUnique({
        where: { companyId_provider: { companyId, provider: 'credits' } }
      });

      const currentCredits = (config?.config as any)?.credits || 0;
      const newCredits = currentCredits + amount;

      await prisma.integrationConfig.upsert({
        where: {
          companyId_provider: { companyId, provider: 'credits' }
        },
        update: {
          config: {
            ...(config?.config as object || {}),
            credits: newCredits,
            lastPurchase: new Date(),
            paymentId
          }
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
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene historial de uso
   */
  static async getUsageHistory(
    companyId: string,
    limit: number = 50
  ): Promise<CreditUsage[]> {
    // En producción, guardarías esto en una tabla separada
    // Por ahora retornamos array vacío
    return [];
  }

  /**
   * Calcula costo estimado de una operación
   */
  static calculateCost(provider: string, operation: string): number {
    const costs: Record<string, number> = {
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