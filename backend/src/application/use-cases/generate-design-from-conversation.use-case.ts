// src/application/use-cases/generate-design-from-conversation.use-case.ts

import { IClaudeGenerator, ConversationMessage, DesignGenerationResult } from '../../domain/services/IClaudeGenerator';

export class GenerateDesignFromConversationUseCase {
    constructor(private claudeGenerator: IClaudeGenerator) {}

    async execute(
        message: string,
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to generate a design.');
        }

        const validHistory = Array.isArray(history) ? history : [];

        return this.claudeGenerator.generateDesignFromConversation(message, validHistory);
    }
}