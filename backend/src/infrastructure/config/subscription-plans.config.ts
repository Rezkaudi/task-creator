import { ENV_CONFIG } from "./env.config";

export interface SubscriptionPlan {
    id: string;
    name: string;
    priceUsd: number;
    priceCents: number;
    dailyPointsLimit: number;
    stripePriceId: string;
}

//Points = (Price - Profit Percentage of Price) * 500

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Basic Monthly',
        priceUsd: 50,
        priceCents: 5000,
        dailyPointsLimit: Math.floor(21250 / 30), //708.33 points per day
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_SUB_BASIC || '',
        //Profit Percentage = 15% => Points = (50 - 7.5) * 500 = 21250

    },
    {
        id: 'premium',
        name: 'Premium Monthly',
        priceUsd: 80,
        priceCents: 8000,
        dailyPointsLimit: Math.floor(36000 / 30), //1200 points per day
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_SUB_PREMIUM || '',
        //Profit Percentage = 10% => Points = (80 - 8) * 500 = 36000
    },
];

export function getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}
