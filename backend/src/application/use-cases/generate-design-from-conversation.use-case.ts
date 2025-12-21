// src/application/use-cases/generate-design-from-conversation.use-case.ts

import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../domain/services/IAiDesignService";

export class GenerateDesignFromConversationUseCase {
    constructor(private aiDesignService: IAiDesignService) { }

    async execute(
        message: string,
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to generate a design.');
        }

        const validHistory = Array.isArray(history) ? history : [];

        return this.aiDesignService.generateDesignFromConversation(message, validHistory);
    }
}