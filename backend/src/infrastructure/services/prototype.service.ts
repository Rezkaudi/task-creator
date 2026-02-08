// File: /backend/src/infrastructure/services/prototype.service.ts

import { IPrototypeService } from '../../domain/services/IPrototypeService';
import { FrameInfo, PrototypeConnection } from '../../domain/entities/prototype-connection.entity';
import { getModelById } from '../config/ai-models.config';
import { IOpenAIClientFactory } from '../../domain/services/IOpenAIClientFactory';
import { IAiCostCalculator } from '../../domain/services/IAiCostCanculator';
import { prototypeConnectionsPrompt } from '../config/prompt.config';

export class PrototypeService implements IPrototypeService {

    constructor(
        private readonly clientFactory: IOpenAIClientFactory,
        private readonly costCalculator: IAiCostCalculator
    ) { }

    async generateConnections(
        frames: FrameInfo[],
        modelId?: string
    ): Promise<{
        connections: PrototypeConnection[];
        message: string;
        reasoning?: string;
        cost?: any;
    }> {
        const aiModel = getModelById(modelId!);
        const openai = this.clientFactory.createClient(aiModel);

        // Build user message
        let userMessage = `## FRAMES DATA\n\`\`\`json\n${JSON.stringify(frames)}\n\`\`\``;

        userMessage += `\n\n## TASK\nAnalyze these frames and generate intelligent prototype connections. Return ONLY valid JSON with no additional text.`;

        try {
            const completion = await openai.chat.completions.create({
                model: aiModel.id,
                messages: [
                    { role: 'system', content: prototypeConnectionsPrompt },
                    { role: 'user', content: userMessage }
                ]
            });

            const responseText = completion.choices[0]?.message?.content;

            if (!responseText) {
                throw new Error('Empty response from AI');
            }

            // Parse the response
            const result = this.parseAIResponse(responseText);

            // Calculate cost
            const inputTokens = completion.usage?.prompt_tokens ?? this.costCalculator.estimateTokens(userMessage);
            const outputTokens = completion.usage?.completion_tokens ?? this.costCalculator.estimateTokens(responseText);
            const costBreakdown = this.costCalculator.calculateCost(aiModel, inputTokens, outputTokens);

            console.log(`💰 Cost: ${costBreakdown.totalCost}`);

            return {
                connections: result.connections,
                message: `Generated ${result.connections.length} prototype connections`,
                reasoning: result.reasoning,
                cost: costBreakdown
            };

        } catch (error) {
            console.error('Error generating prototype connections:', error);
            throw new Error(
                `Failed to generate prototype connections: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Parse the AI response and extract connections
     */
    private parseAIResponse(response: string): {
        connections: PrototypeConnection[];
        reasoning?: string;
    } {
        try {
            // Clean the response - remove markdown code blocks if present
            let cleaned = response.trim();

            if (cleaned.includes('```json')) {
                cleaned = cleaned.split('```json')[1].split('```')[0].trim();
            } else if (cleaned.includes('```')) {
                cleaned = cleaned.split('```')[1].split('```')[0].trim();
            }

            // Try to find JSON object
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                connections: parsed.connections || [],
                reasoning: parsed.reasoning
            };

        } catch (error) {
            console.error('Failed to parse AI response:', error);
            console.error('Raw response:', response.substring(0, 500));
            throw new Error('Failed to parse AI response as JSON');
        }
    }
}
