import { IAiDesignService, ConversationMessage, DesignGenerationResult } from "../../domain/services/IAiDesignService";

/**
 * Use case for generating a new design based on an existing design's style
 * Extracts design system from reference design and creates new design following same patterns
 */
export class GenerateDesignBasedOnExistingUseCase {
    constructor(private aiDesignService: IAiDesignService) { }

    /**
     * Generate a new design based on existing design's style
     * @param message - User's request for new design (e.g., "create a login page")
     * @param history - Conversation history
     * @param referenceDesign - The design to extract design system from (JSON format)
     * @param modelId - AI model to use
     * @returns Design generation result with new design following reference style
     */
    async execute(
        message: string,
        history: ConversationMessage[],
        referenceDesign: any,
        modelId: string
    ): Promise<DesignGenerationResult> {
        if (!message || message.trim().length === 0) {
            throw new Error('Message is required to generate a design.');
        }

        if (!referenceDesign) {
            throw new Error('Reference design is required to extract design system.');
        }

        const validHistory = Array.isArray(history) ? history : [];

        return this.aiDesignService.generateDesignBasedOnExisting(
            message,
            validHistory,
            referenceDesign,
            modelId
        );
    }
}