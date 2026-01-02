import { CostBreakdown } from '../../domain/services/IAiCostCanculator';
import { AIModelConfig } from '../config/ai-models.config';



export class AiCostCalculatorService {
    /**
     * Calculate cost based on token usage
     */
    calculateCost(
        model: AIModelConfig,
        inputTokens: number,
        outputTokens: number
    ): CostBreakdown {
        // Convert prices from per million to per token
        const inputPricePerToken = model.inputPricePerMillion / 1000000;
        const outputPricePerToken = model.outputPricePerMillion / 1000000;

        const inputCost = inputTokens * inputPricePerToken;
        const outputCost = outputTokens * outputPricePerToken;
        const totalCost = inputCost + outputCost;

        return {
            inputCost: `$${this.roundToDecimal(inputCost, 2)}`,
            outputCost: `$${this.roundToDecimal(outputCost, 2)}`,
            totalCost: `$${this.roundToDecimal(totalCost, 2)}`,
            inputTokens,
            outputTokens,
            modelId: model.id,
            timestamp: new Date()
        };
    }

    /**
     * Estimate token count from text (approximate)
     */
    estimateTokens(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters for English text
        // This is a simplified estimation
        return Math.ceil(text.length / 4);
    }

    /**
     * Estimate tokens from JSON object
     */
    estimateTokensFromJson(jsonObject: any): number {
        const jsonString = JSON.stringify(jsonObject);
        return this.estimateTokens(jsonString);
    }

    /**
     * Helper method to round to specific decimal places
     */
    private roundToDecimal(value: number, decimalPlaces: number): number {
        const multiplier = Math.pow(10, decimalPlaces);
        return Math.round(value * multiplier) / multiplier;
    }

    /**
     * Format cost for display
     */
    formatCost(cost: number): string {
        if (cost < 0.000001) {
            return '< $0.000001';
        }
        return `$${cost.toFixed(2)}`;
    }
}