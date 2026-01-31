// File: /backend/src/infrastructure/web/controllers/client-error.controller.ts

import { NextFunction, Request, Response } from "express";
import { ReportClientErrorUseCase } from "../../../application/use-cases/report-client-error.use-case";
import { ReportClientErrorRequest } from "../../../application/dto/client-error.dto";

export class ClientErrorController {
    constructor(
        private readonly reportClientErrorUseCase: ReportClientErrorUseCase
    ) { }

    async reportError(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const errorData: ReportClientErrorRequest = req.body;

            // Get Figma user info from headers (not internal user ID)
            const figmaUserId = req.headers['x-figma-user-id'] as string;
            const userName = req.headers['x-figma-user-name'] as string;

            const clientError = await this.reportClientErrorUseCase.execute(
                errorData,
                figmaUserId,
                userName ? decodeURIComponent(userName) : undefined
            );

            res.status(201).json({
                success: true,
                error: clientError,
                message: 'Error reported successfully',
            });
        } catch (error) {
            console.error("Error reporting client error:", error);

            // Still return success to avoid blocking the client
            // Log the meta-error but don't fail the request
            res.status(200).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to report error',
            });
        }
    }
}