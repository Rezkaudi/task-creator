// File: /backend/src/application/use-cases/report-client-error.use-case.ts

import { IClientErrorRepository } from "../../domain/repositories/client-error.repository";
import { ClientError } from "../../domain/entities/client-error.entity";
import { ReportClientErrorRequest } from "../dto/client-error.dto";

export class ReportClientErrorUseCase {
    constructor(
        private readonly clientErrorRepository: IClientErrorRepository
    ) { }

    async execute(
        request: ReportClientErrorRequest,
        figmaUserId?: string,
        userName?: string
    ): Promise<ClientError> {
        // Validate required fields
        if (!request.errorMessage || request.errorMessage.trim().length === 0) {
            throw new Error('Error message is required');
        }

        // Sanitize and limit error message length
        const sanitizedMessage = request.errorMessage.substring(0, 5000);
        const sanitizedStack = request.errorStack?.substring(0, 10000);

        const clientError = await this.clientErrorRepository.create({
            figmaUserId,
            userName,
            errorCode: request.errorCode?.substring(0, 100),
            errorMessage: sanitizedMessage,
            errorStack: sanitizedStack,
            errorDetails: request.errorDetails,
            pluginVersion: request.pluginVersion?.substring(0, 50),
            figmaVersion: request.figmaVersion?.substring(0, 50),
            platform: request.platform?.substring(0, 100),
            browserInfo: request.browserInfo?.substring(0, 500),
            componentName: request.componentName?.substring(0, 255),
            actionType: request.actionType?.substring(0, 255),
        });

        console.log(`🐛 Client error logged: [${clientError.errorCode || 'NO_CODE'}] ${sanitizedMessage.substring(0, 100)}... (User: ${userName || figmaUserId || 'anonymous'})`);

        return clientError;
    }
}