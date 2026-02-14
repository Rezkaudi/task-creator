import { POINTS_PACKAGES } from "../../infrastructure/config/points-packages.config";

export class GetAvailablePackagesUseCase {
    execute() {
        return POINTS_PACKAGES.map((pkg) => ({
            id: pkg.id,
            name: pkg.name,
            points: pkg.points,
            priceUsd: pkg.priceUsd,
            priceCents: pkg.priceCents,
        }));
    }
}
