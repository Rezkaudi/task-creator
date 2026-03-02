export type DesignGenerationOperationType = 'create' | 'create_by_reference' | 'edit' | 'prototype';
export type DesignGenerationStatus = 'success' | 'failed';

export interface DesignGeneration {
    id: string;
    userId: string;
    prompt: string;
    operationType: DesignGenerationOperationType;
    modelId: string;
    designSystemId?: string | null;
    conversationHistory?: any[] | null;
    currentDesign?: any | null;
    referenceDesign?: any | null;
    resultDesign?: any | null;
    resultConnections?: any[] | null;
    aiMessage?: string | null;
    status: DesignGenerationStatus;
    errorMessage?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalCost?: string | null;
    pointsDeducted?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}
