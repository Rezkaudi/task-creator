import { IPointsService } from "../../domain/services/IPointsService";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { ENV_CONFIG } from "../config/env.config";
import { getModelById } from "../config/ai-models.config";

export class PointsService implements IPointsService {
    private readonly pointsPerDollar: number;
    private readonly userRepository: IUserRepository;

    constructor(userRepository: IUserRepository) {
        this.userRepository = userRepository;
        this.pointsPerDollar = Number(ENV_CONFIG.POINTS_PER_DOLLAR || 500);
    }

    isFreeModel(modelId: string): boolean {
        return getModelById(modelId).isFree
    }

    calculatePointsCost(modelId: string, inputTokens: number, outputTokens: number): number {
        if (this.isFreeModel(modelId)) {
            return 0;
        }

        const model = getModelById(modelId);
        const inputUnitCost = model.inputPricePerMillion / 1_000_000;
        const outputUnitCost = model.outputPricePerMillion / 1_000_000;
        const usdCost = (inputTokens * inputUnitCost) + (outputTokens * outputUnitCost);
        const points = Math.ceil(usdCost * this.pointsPerDollar);

        return Math.max(points, 0);
    }

    async hasEnoughPoints(userId: string, estimatedCost: number): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return false;
        }
        return user.pointsBalance >= Math.max(estimatedCost, 0);
    }

    async deductForUsage(
        userId: string,
        modelId: string,
        inputTokens: number,
        outputTokens: number,
    ): Promise<number> {
        const pointsToDeduct = this.calculatePointsCost(modelId, inputTokens, outputTokens);

        if (pointsToDeduct <= 0) {
            return 0;
        }

        await this.userRepository.deductPoints(userId, pointsToDeduct);
        return pointsToDeduct;
    }
}
