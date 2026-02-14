export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: 'active' | 'canceled' | 'past_due' | 'expired';
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    dailyLimit: number;
    dailyUsageCount: number;
    lastUsageResetDate: string;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}
