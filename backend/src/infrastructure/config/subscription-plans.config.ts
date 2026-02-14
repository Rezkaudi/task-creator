export interface SubscriptionPlan {
    id: string;
    name: string;
    priceUsd: number;
    priceCents: number;
    dailyPointsLimit: number;
    stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic Monthly',
        priceUsd: 9,
        priceCents: 900,
        dailyPointsLimit: 1000,
        stripePriceId: process.env.STRIPE_PRICE_SUB_BASIC || '',
    },
    {
        id: 'premium',
        name: 'Premium Monthly',
        priceUsd: 19,
        priceCents: 1900,
        dailyPointsLimit: 3000,
        stripePriceId: process.env.STRIPE_PRICE_SUB_PREMIUM || '',
    },
];

export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}
