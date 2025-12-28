
import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../domain/services/IAiDesignService";

export class EditDesignWithAIUseCase {
    constructor(private aiDesignService: IAiDesignService) { }

    async execute(
        message: string,
        history: ConversationMessage[],
        currentDesign: any,
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to edit the design.');
        }

        if (!currentDesign) {
            throw new Error('Current design is required for editing.');
        }

        const validHistory = Array.isArray(history) ? history : [];

        return this.aiDesignService.editDesignWithAI(
            message,
            validHistory,
            currentDesign,
            modelId,
            designSystemId
        );
    }
}