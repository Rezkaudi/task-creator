import { Request, Response } from 'express';
import { GenerateDesignFromClaudeUseCase } from '../../../application/use-cases/generate-design-from-claude.use-case';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { DesignGenerationResult } from '../../../domain/services/IClaudeGenerator';

export class DesignController {
    constructor(
        private readonly generateDesignUseCase: GenerateDesignFromClaudeUseCase,
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase
    ) {}

  
    async generateFromText(req: Request, res: Response): Promise<void> {
        const { prompt } = req.body;

        try {
            const designData = await this.generateDesignUseCase.execute(prompt);
            res.status(200).json(designData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            res.status(500).json({ success: false, message });
        }
    }

  
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history } = req.body;

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
            console.log("History length:", history ? history.length : 0);

            const result: DesignGenerationResult = await this.generateDesignFromConversationUseCase.execute(
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
                message 
            });
        }
    }
}
