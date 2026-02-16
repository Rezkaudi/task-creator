import { ENV_CONFIG } from "./env.config";

export interface PointsPackage {
    id: string;
    name: string;
    points: number;
    priceUsd: number;
    priceCents: number;
    stripePriceId: string;
}


//Points = (Price - Profit Percentage of Price) * 500

export const POINTS_PACKAGES: PointsPackage[] = [
    {
        id: 'starter',
        name: 'Starter Pack',
        points: 3750,
        priceUsd: 10,
        priceCents: 1000,
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_STARTER || '',
        //Profit Percentage = 25% => Points = (10 - 2.5) * 500 = 3750
    },
    {
        id: 'pro',
        name: 'Pro Pack',
        points: 10000,
        priceUsd: 25,
        priceCents: 2500,
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_PRO || '',
        //Profit Percentage = 20% => Points = (25 - 5) * 500 = 10000
    },
];

export function getPointsPackage(packageId: string): PointsPackage | undefined {
    return POINTS_PACKAGES.find((pkg) => pkg.id === packageId);
}
