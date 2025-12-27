import { Request, Response } from 'express';
import { GenerateDesignFromTextUseCase } from '../../../application/use-cases/generate-design-from-text.use-case';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/edit-design-with-ai.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';

import { getDesignSystemById } from '../../config/design-systems.config';
import { getModelById } from '../../config/ai-models.config';

export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromTextUseCase,
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase
    ) { }


    private validateModelAndDesignSystem(model: string, designSystemId?: string): { valid: boolean; error?: string } {
        if (!getModelById(model)) {
            return {
                valid: false,
                error: `Model '${model}' is not available or invalid`
            };
        }

        if (designSystemId && designSystemId !== 'none') {
            const designSystem = getDesignSystemById(designSystemId);
            if (!designSystem) {
                return {
                    valid: false,
                    error: `Design System '${designSystemId}' is not available or invalid`
                };
            }
        }

        return { valid: true };
    }

    /**
     * Generate design from simple text prompt
     */
    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt, modelId, designSystemId } = req.body;

        try {
            if (!prompt) {
                res.status(400).json({
                    success: false,
                    message: 'Prompt is required'
                });
                return;
            }

            const validation = this.validateModelAndDesignSystem(modelId || 'gpt-4', designSystemId);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    message: validation.error
                });
                return;
            }

            const designData = await this.generateDesignUseCase.execute(prompt, designSystemId);

            res.status(200).json({
                success: true,
                message: 'Design generated successfully',
                design: designData,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            console.error('Error generating design:', error);
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });
        }
    }

    /**
     * Generate design from conversation with history
     */
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history, modelId, designSystemId } = req.body;

        try {
            if (!message) {
                res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
                return;
            }

            const validation = this.validateModelAndDesignSystem(modelId || 'gpt-4', designSystemId);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    message: validation.error
                });
                return;
            }

            console.log("--- Received Conversation Request ---");
            console.log("Message:", message);
            console.log("Model:", modelId || 'gpt-4 (default)');
            console.log("Design System:", designSystemId || 'none');
            console.log("History length:", history ? history.length : 0);

            const result: DesignGenerationResult = await this.generateDesignFromConversationUseCase.execute(
                message,
                history || [],
                modelId,
                designSystemId
            );

            console.log("--- Generated Design Result ---");
            console.log("AI Message:", result.message);
            console.log("Design Data:", result.design ? "Present" : "Missing");
            console.log("Preview HTML:", result.previewHtml ? "Present" : "Missing");

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });

        } catch (error) {
            console.error("Error in generateFromConversation:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });
        }
    }

    /**
     * Edit existing design with AI
     */
    async editWithAI(req: Request, res: Response): Promise<void> {
        const { message, history, currentDesign, modelId, designSystemId } = req.body;

        try {
            if (!message) {
                res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
                return;
            }

            if (!currentDesign) {
                res.status(400).json({
                    success: false,
                    message: 'Current design is required for editing'
                });
                return;
            }

            const validation = this.validateModelAndDesignSystem(modelId || 'gpt-4', designSystemId);
            if (!validation.valid) {
                res.status(400).json({
                    success: false,
                    message: validation.error
                });
                return;
            }

            console.log("--- Received Edit Request ---");
            console.log("Message:", message);
            console.log("Model:", modelId || 'gpt-4 (default)');
            console.log("Design System:", designSystemId || 'none');
            console.log("History length:", history ? history.length : 0);
            console.log("Current Design:", currentDesign ? "Present" : "Missing");


            const result: DesignGenerationResult = await this.editDesignWithAIUseCase.execute(
                message,
                history || [],
                currentDesign,
                modelId,
                designSystemId
            );

            console.log("--- Edit Result ---");
            console.log("AI Message:", result.message);
            console.log("Design Data:", result.design ? "Present" : "Missing");
            console.log("Preview HTML:", result.previewHtml ? "Present" : "Missing");

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });

        } catch (error) {
            console.error("Error in editWithAI:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                metadata: {
                    model: modelId || 'gpt-4',
                    designSystem: designSystemId || 'none'
                }
            });
        }
    }
}