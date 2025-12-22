import { Request, Response } from 'express';
import { GenerateDesignFromTextUseCase } from '../../../application/use-cases/generate-design-from-text.use-case';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/edit-design-with-ai.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';

// أضيفي imports الـservices
import { GPTDesignService } from '../../services/design/gpt-design.service';
import { DeepSeekDesignService } from '../../services/design/deepseek-design.service';
import { CloudeDesignService } from '../../services/design/cloude-design.service';
import { GiminiDesignService } from '../../services/design/gimini-design.service';
import { IAiDesignService } from '../../../domain/services/IAiDesignService';

export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromTextUseCase,
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase
    ) { }

    
    private createDesignService(model?: string): IAiDesignService {
        const selectedModel = (model || 'gpt-4').toLowerCase();
        console.log(`🎯 Creating AI service for model: ${selectedModel}`);
        
        switch (selectedModel) {
            case 'gimini':
            case 'gemini':
                console.log('🚀 Using Gemini AI service');
                return new GiminiDesignService();
            
            case 'deepseek':
                console.log('🚀 Using DeepSeek AI service');
                return new DeepSeekDesignService();
            
            case 'claude':
            case 'cloude':
                console.log('🚀 Using Claude AI service');
                return new CloudeDesignService();
            
            case 'gpt-4':
            default:
                console.log('🚀 Using GPT-4 AI service (default)');
                return new GPTDesignService();
        }
    }

    /**
     * Generate design from simple text prompt
     */
    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt, model } = req.body;

        try {
            if (!prompt) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Prompt is required' 
                });
                return;
            }

            console.log(`🎨 Generating design with model: ${model || 'gpt-4 (default)'}`);
            
            const designService = this.createDesignService(model);
            const useCase = new GenerateDesignFromTextUseCase(designService);
            
            const designData = await useCase.execute(prompt);
            
            res.status(200).json({
                success: true,
                message: 'Design generated successfully',
                design: designData
            });
            
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            console.error('Error generating design:', error);
            res.status(500).json({ 
                success: false, 
                message,
                model: model || 'gpt-4'
            });
        }
    }

    /**
     * Generate design from conversation with history
     */
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history, model } = req.body;

        try {
            if (!message) {
                res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
                return;
            }

            console.log("--- Received Conversation Request ---");
            console.log("Message:", message);
            console.log("Model:", model || 'gpt-4 (default)');
            console.log("History length:", history ? history.length : 0);

            const designService = this.createDesignService(model);
            const useCase = new GenerateDesignFromConversationUseCase(designService);
            
            const result: DesignGenerationResult = await useCase.execute(
                message,
                history || []
            );

            console.log("--- Generated Design Result ---");
            console.log("AI Message:", result.message);
            console.log("Design Data:", result.design ? "Present" : "Missing");
            console.log("Preview HTML:", result.previewHtml ? "Present" : "Missing");

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml
            });

        } catch (error) {
            console.error("Error in generateFromConversation:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                model: model || 'gpt-4'
            });
        }
    }

    /**
     * Edit existing design with AI
     */
    async editWithAI(req: Request, res: Response): Promise<void> {
        const { message, history, currentDesign, model } = req.body;

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

            console.log("--- Received Edit Request ---");
            console.log("Message:", message);
            console.log("Model:", model || 'gpt-4 (default)');
            console.log("History length:", history ? history.length : 0);
            console.log("Current Design:", currentDesign ? "Present" : "Missing");

            const designService = this.createDesignService(model);
            const useCase = new EditDesignWithAIUseCase(designService);
            
            const result: DesignGenerationResult = await useCase.execute(
                message,
                history || [],
                currentDesign
            );

            console.log("--- Edit Result ---");
            console.log("AI Message:", result.message);
            console.log("Design Data:", result.design ? "Present" : "Missing");
            console.log("Preview HTML:", result.previewHtml ? "Present" : "Missing");

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml
            });

        } catch (error) {
            console.error("Error in editWithAI:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({
                success: false,
                message,
                model: model || 'gpt-4'
            });
        }
    }
}