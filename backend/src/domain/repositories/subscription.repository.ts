import { Subscription } from "../entities/subscription.entity";

export interface ISubscriptionRepository {
    create(sub: Partial<Subscription>): Promise<Subscription>;
    findById(id: string): Promise<Subscription | null>;
    findActiveByUserId(userId: string): Promise<Subscription | null>;
    findByStripeSubscriptionId(stripeSubId: string): Promise<Subscription | null>;
    updateStatus(id: string, status: Subscription['status']): Promise<void>;
    incrementDailyPointsUsed(id: string, points: number): Promise<{ dailyPointsUsed: number; wasReset: boolean }>;
    update(id: string, data: Partial<Subscription>): Promise<void>;
}
