// File: /backend/src/application/dto/client-error.dto.ts

import { ClientError } from "../../domain/entities/client-error.entity";

export interface ReportClientErrorRequest {
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
}

export interface ReportClientErrorResponse {
    success: boolean;
    error?: ClientError;
    message?: string;
}

export interface GetClientErrorsResponse {
    success: boolean;
    errors: ClientError[];
    total: number;
    message?: string;
}