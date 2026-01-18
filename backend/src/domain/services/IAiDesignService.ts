// src/domain/services/IAiDesignService.ts

import { CostBreakdown } from "./IAiCostCanculator";

export interface ConversationMessage {
    role: string;
    content: string;
}

export interface DesignGenerationResult {
    message: string;
    design: any;
    previewHtml?: string | null;
    cost: CostBreakdown;
}

/**
 * Interface for AI Design Services
 * Supports multiple AI models with optional Design System integration
 */
export interface IAiDesignService {
    /**
     * Generate design from simple text prompt
     * 
     * @param prompt - Text description of the design
     * @param designSystemId - Optional Design System ID (material-3, shadcn-ui, ant-design, Default design system)
     * @returns Promise with generated design JSON
     */
    generateDesign(prompt: string, modelId: string, designSystemId: string): Promise<any>;

    /**
     * Generate design from conversation with history
     * 
     * @param userMessage - Current user message
     * @param history - Conversation history
     * @param designSystemId - Optional Design System ID
     * @returns Promise with DesignGenerationResult
     */
    generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult>;

    /**
     * Edit existing design with AI
     * 
     * @param userMessage - User's edit request
     * @param history - Conversation history
     * @param currentDesign - Current design JSON to edit
     * @param designSystemId - Optional Design System ID (maintains consistency)
     * @returns Promise with DesignGenerationResult containing edited design
     */
    editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: any,
        modelId: string,
        designSystemId: string
    ): Promise<DesignGenerationResult>;
}