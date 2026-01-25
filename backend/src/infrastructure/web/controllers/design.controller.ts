import { Request, Response } from 'express';
import { GenerateDesignFromTextUseCase } from '../../../application/use-cases/generate-design-from-text.use-case';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/edit-design-with-ai.use-case';
import { GenerateDesignBasedOnExistingUseCase } from '../../../application/use-cases/generate-design-based-on-existing.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';

export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromTextUseCase,
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase,
        private readonly generateDesignBasedOnExistingUseCase: GenerateDesignBasedOnExistingUseCase
    ) { }

    // Generate design from simple text prompt
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

    // ✨ NEW METHOD - Generate design based on existing design's style
    async generateBasedOnExisting(req: Request, res: Response): Promise<void> {
        const { message, history, referenceDesign, modelId } = req.body;

        try {
            if (!message || !referenceDesign) {
                res.status(400).json({
                    success: false,
                    message: 'Message and reference design are required'
                });
                return;
            }

            const result: DesignGenerationResult = await this.generateDesignBasedOnExistingUseCase.execute(
                message,
                history || [],
                referenceDesign,
                modelId || 'mistralai/devstral-2512:free'
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                metadata: {
                    model: modelId || 'mistralai/devstral-2512:free',
                    mode: 'based-on-existing'
                }
            });

        } catch (error) {
            console.error("Error in generateBasedOnExisting:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    mode: 'based-on-existing'
                }
            });
        }
    }
}