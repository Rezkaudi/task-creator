export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: 'active' | 'canceled' | 'past_due' | 'expired';
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    dailyPointsLimit: number;
    dailyPointsUsed: number;
    lastUsageResetDate: string;
    cancelAtPeriodEnd: boolean;
    createdAt: Date;
    updatedAt: Date;
}
