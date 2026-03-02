// File: /backend/src/domain/entities/client-error.entity.ts

export interface ClientError {
    id: string;
    figmaUserId?: string;
    userName?: string;
    errorMessage: string;
    errorDetails?: Record<string, any>;
    actionType?: string;
    createdAt?: Date;
}