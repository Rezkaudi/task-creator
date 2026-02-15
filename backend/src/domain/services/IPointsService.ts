export interface IPointsService {
    calculatePointsCost(modelId: string, inputTokens: number, outputTokens: number): number;
    hasEnoughPoints(userId: string, estimatedCost: number): Promise<boolean>;
    deductForUsage(userId: string, modelId: string, inputTokens: number, outputTokens: number): Promise<number>;
    isFreeModel(modelId: string): boolean;
}
