// File: /backend/src/domain/entities/client-error.entity.ts

export interface ClientError {
    id: string;
    figmaUserId?: string;
    userName?: string;
    errorCode?: string;
    errorMessage: string;
    errorStack?: string;
    errorDetails?: Record<string, any>;
    pluginVersion?: string;
    figmaVersion?: string;
    platform?: string;
    browserInfo?: string;
    componentName?: string;
    actionType?: string;
    createdAt?: Date;
}