export interface ConversationMessage {
    role: string;
    content: string;
}

export interface DesignGenerationResult {
    message: string;
    design: any;
    previewHtml?: string | null;
}

export interface IAiDesignService {
    generateDesign(prompt: string): Promise<any>;

    generateDesignFromConversation(
        userMessage: string,
        history: ConversationMessage[]
    ): Promise<DesignGenerationResult>;

    editDesignWithAI(
        userMessage: string,
        history: ConversationMessage[],
        currentDesign: any
    ): Promise<DesignGenerationResult>;
}