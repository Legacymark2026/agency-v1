export declare class GoldneezService {
    /**
     * Obtener puntos de recompensas de un cliente
     */
    static getPoints(customerId: string): Promise<number>;
    /**
     * Canjear recompensa y registrar en base de datos
     */
    static redeemReward(customerId: string, rewardId: string, pointsCost: number): Promise<{
        success: boolean;
        txId: `${string}-${string}-${string}-${string}-${string}`;
    }>;
}
