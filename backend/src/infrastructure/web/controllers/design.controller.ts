import { Request, Response } from 'express';
import { GenerateDesignFromTextUseCase } from '../../../application/use-cases/generate-design-from-text.use-case';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/edit-design-with-ai.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';
import { AiGenerateDesignService } from '../../services/ai-generate-design.service';
export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromTextUseCase,
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase,
        private readonly aiGenerateDesignService: AiGenerateDesignService
    ) { }

    // Generate design from simple text prompt
     async getLastCost(req: Request, res: Response): Promise<void> {
        try {
            const lastCost = this.aiGenerateDesignService.getLastCost();
            
            if (!lastCost) {
                res.status(200).json({
                    success: true,
                    message: 'No cost recorded yet',
                    cost: null
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Last cost retrieved successfully',
                cost: lastCost,
                formatted: {
                    input: lastCost.inputCost,
                    output: lastCost.outputCost,
                    total: lastCost.totalCost,
                    tokens: {
                        input: lastCost.inputTokens,
                        output: lastCost.outputTokens,
                        total: lastCost.inputTokens + lastCost.outputTokens
                    },
                    model: lastCost.modelId,
                    timestamp: lastCost.timestamp
                }
            });

        } catch (error) {
            console.error("Error getting last cost:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message
            });
        }
    }
    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt, modelId, designSystemId } = req.body;

        try {
            const designData = await this.generateDesignUseCase.execute(prompt, modelId, designSystemId);
            res.status(200).json({
                success: true,
                message: 'Design generated successfully',
                design: designData.design,
                cost: designData.cost,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            console.error('Error generating design:', error);
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });
        }
    }

    // Generate design from conversation with history
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history, modelId, designSystemId } = req.body;

        try {
            const result: DesignGenerationResult = await this.generateDesignFromConversationUseCase.execute(
                message,
                history || [],
                modelId,
                designSystemId
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });

        } catch (error) {
            console.error("Error in generateFromConversation:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });
        }
    }

    // Edit existing design with AI
    async editWithAI(req: Request, res: Response): Promise<void> {
        const { message, history, currentDesign, modelId, designSystemId } = req.body;

        try {
            const result: DesignGenerationResult = await this.editDesignWithAIUseCase.execute(
                message,
                history || [],
                currentDesign,
                modelId,
                designSystemId
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });

        } catch (error) {
            console.error("Error in editWithAI:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });
        }
    }
}