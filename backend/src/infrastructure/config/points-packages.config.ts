import { ENV_CONFIG } from "./env.config";

export interface PointsPackage {
    id: string;
    name: string;
    points: number;
    priceUsd: number;
    priceCents: number;
    stripePriceId: string;
}

export const POINTS_PACKAGES: PointsPackage[] = [
    {
        id: 'starter',
        name: 'Starter Pack',
        points: 5000,
        priceUsd: 10,
        priceCents: 1000,
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_STARTER || '',
    },
    {
        id: 'pro',
        name: 'Pro Pack',
        points: 15000,
        priceUsd: 25,
        priceCents: 2500,
        stripePriceId: ENV_CONFIG.STRIPE_PRICE_PRO || '',
    },
];

export function getPointsPackage(packageId: string): PointsPackage | undefined {
    return POINTS_PACKAGES.find((pkg) => pkg.id === packageId);
}
