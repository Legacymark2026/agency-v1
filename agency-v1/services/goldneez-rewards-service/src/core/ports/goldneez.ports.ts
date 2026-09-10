/**
 * Goldneez Rewards Service — Hexagonal Ports
 */
import { RewardWalletDomain } from "../domain/goldneez.domain";

export interface IGoldneezUseCases {
  getWallet(userId: string): Promise<RewardWalletDomain>;
  creditPoints(userId: string, points: number, reason: string): Promise<RewardWalletDomain>;
  redeemPoints(userId: string, points: number): Promise<RewardWalletDomain>;
}

export interface IRewardRepositoryPort {
  save(wallet: RewardWalletDomain): Promise<RewardWalletDomain>;
  findByUserId(userId: string): Promise<RewardWalletDomain | null>;
}

export interface IRewardEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
