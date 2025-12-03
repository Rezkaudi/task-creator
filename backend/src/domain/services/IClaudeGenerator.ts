// src/domain/services/IClaudeGenerator.ts

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface DesignGenerationResult {
    message: string;
    design: any;
    previewHtml?: string | null; 
}

export interface IClaudeGenerator {
    generateDesign(prompt: string): Promise<any>;
    
    generateDesignFromConversation(
        userMessage: string, 
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult>;
}
