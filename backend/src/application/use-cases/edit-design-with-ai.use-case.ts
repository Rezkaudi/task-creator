// src/application/use-cases/edit-design-with-ai.use-case.ts

import { IClaudeGenerator, ConversationMessage, DesignGenerationResult } from '../../domain/services/IClaudeGenerator';

export class EditDesignWithAIUseCase {
    constructor(private claudeGenerator: IClaudeGenerator) {}

    async execute(
        message: string,
        history: ConversationMessage[],
        currentDesign: any
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to edit the design.');
        }

        if (!currentDesign) {
            throw new Error('Current design is required for editing.');
        }

        const validHistory = Array.isArray(history) ? history : [];

        return this.claudeGenerator.editDesignWithAI(message, validHistory, currentDesign);
    }
}