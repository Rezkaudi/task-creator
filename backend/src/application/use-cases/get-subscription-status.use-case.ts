import { ISubscriptionRepository } from "../../domain/repositories/subscription.repository";

export class GetSubscriptionStatusUseCase {
    constructor(
        private readonly subscriptionRepository: ISubscriptionRepository,
    ) {}

    async execute(userId: string): Promise<{
        hasSubscription: boolean;
        subscription: {
            planId: string;
            status: string;
            dailyLimit: number;
            dailyUsageCount: number;
            lastUsageResetDate: string;
            currentPeriodEnd: Date;
            cancelAtPeriodEnd: boolean;
        } | null;
    }> {
        const subscription = await this.subscriptionRepository.findActiveByUserId(userId);

        if (!subscription) {
            return { hasSubscription: false, subscription: null };
        }

        const today = new Date().toISOString().split("T")[0];
        const dailyUsageCount = subscription.lastUsageResetDate === today
            ? subscription.dailyUsageCount
            : 0;

        return {
            hasSubscription: true,
            subscription: {
                planId: subscription.planId,
                status: subscription.status,
                dailyLimit: subscription.dailyLimit,
                dailyUsageCount,
                lastUsageResetDate: subscription.lastUsageResetDate,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            },
        };
    }
}
