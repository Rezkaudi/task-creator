// File: /backend/src/application/dto/client-error.dto.ts

import { ClientError } from "../../domain/entities/client-error.entity";

export interface ReportClientErrorRequest {
    errorMessage: string;
    errorDetails?: Record<string, any>;
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