// src/domain/services/IAiDesignService.ts

import { FigmaDesign } from "../entities/figma-design.entity";
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

export interface IAiDesignService {
    generateDesign(prompt: string, modelId: string, designSystemId: string): Promise<any>;
    
    generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[],
        modelId: string,
        designSystemId: string,
    ): Promise<DesignGenerationResult>;

    editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: FigmaDesign[],
        modelId: string,
        designSystemId: string,
    ): Promise<DesignGenerationResult>;

    generateDesignBasedOnExisting(
        userMessage: string,
        history: ConversationMessage[],
        referenceToon: string,
        modelId: string
    ): Promise<DesignGenerationResult>;
}