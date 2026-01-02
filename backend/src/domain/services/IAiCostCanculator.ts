import { AIModelConfig } from "../../infrastructure/config/ai-models.config";

export interface CostBreakdown {
    inputCost: string;
    outputCost: string;
    totalCost: string;
    inputTokens: number;
    outputTokens: number;
    modelId: string;
    timestamp: Date;
}

export interface IAiCostCalculator {
    /**
     * Calculate cost based on token usage
     */
    calculateCost(
        model: AIModelConfig,
        inputTokens: number,
        outputTokens: number
    ): CostBreakdown;

    /**
     * Estimate token count from text (approximate)
     */
    estimateTokens(text: string): number;

    /**
     * Estimate tokens from JSON object
     */
    estimateTokensFromJson(jsonObject: any): number;
}   