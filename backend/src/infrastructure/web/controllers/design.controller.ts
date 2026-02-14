import { Request, Response } from 'express';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/edit-design-with-ai.use-case';
import { GenerateDesignBasedOnExistingUseCase } from '../../../application/use-cases/generate-design-based-on-existing.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';
import { GeneratePrototypeConnectionsUseCase } from '../../../application/use-cases/generate-prototype-connections.use-case';
import { IPointsService } from '../../../domain/services/IPointsService';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { HttpError, PaymentRequiredError } from '../../../application/errors/http-errors';
import { ENV_CONFIG } from '../../config/env.config';

interface PointsResponse {
    deducted: number;
    remaining: number;
    wasFree: boolean;
    hasPurchased: boolean;
}

export class DesignController {
    constructor(
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase,
        private readonly generateDesignBasedOnExistingUseCase: GenerateDesignBasedOnExistingUseCase,
        private readonly generatePrototypeConnectionsUseCase: GeneratePrototypeConnectionsUseCase,
        private readonly pointsService: IPointsService,
        private readonly userRepository: IUserRepository,

    ) { }

    // Generate design from conversation with history
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history, modelId, designSystemId } = req.body;

        try {
            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            const result: DesignGenerationResult = await this.generateDesignFromConversationUseCase.execute(
                message,
                history || [],
                modelId,
                designSystemId
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result.cost?.inputTokens ?? 0,
                result.cost?.outputTokens ?? 0,
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                points,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });

        } catch (error) {
            console.error("Error in generateFromConversation:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            const statusCode = this.resolveErrorStatusCode(error);
            res.status(statusCode).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });
        }
    }

    // Edit existing design with AI
    async editWithAI(req: Request, res: Response): Promise<void> {
        const { message, history, currentDesign, modelId, designSystemId } = req.body;

        try {
            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            const result: DesignGenerationResult = await this.editDesignWithAIUseCase.execute(
                message,
                history || [],
                currentDesign,
                modelId,
                designSystemId
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result.cost?.inputTokens ?? 0,
                result.cost?.outputTokens ?? 0,
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                points,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });

        } catch (error) {
            console.error("Error in editWithAI:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            const statusCode = this.resolveErrorStatusCode(error);
            res.status(statusCode).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    designSystem: designSystemId
                }
            });
        }
    }

    // Generate design based on existing design's style
    async generateBasedOnExisting(req: Request, res: Response): Promise<void> {
        const { message, history, referenceDesign, modelId } = req.body;

        try {
            if (!message || !referenceDesign) {
                res.status(400).json({
                    success: false,
                    message: 'Message and reference design are required'
                });
                return;
            }

            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            const result: DesignGenerationResult = await this.generateDesignBasedOnExistingUseCase.execute(
                message,
                history || [],
                referenceDesign,
                modelId
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result.cost?.inputTokens ?? 0,
                result.cost?.outputTokens ?? 0,
            );

            res.status(200).json({
                success: true,
                message: result.message,
                design: result.design,
                previewHtml: result.previewHtml,
                cost: result.cost,
                points,
                metadata: {
                    model: modelId,
                    mode: 'based-on-existing'
                }
            });

        } catch (error) {
            console.error("Error in generateBasedOnExisting:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            const statusCode = this.resolveErrorStatusCode(error);
            res.status(statusCode).json({
                success: false,
                message,
                metadata: {
                    model: modelId,
                    mode: 'based-on-existing'
                }
            });
        }
    }

    async generatePrototype(req: Request, res: Response): Promise<void> {
        try {
            const { frames, modelId } = req.body;
            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            // Execute use case
            const result = await this.generatePrototypeConnectionsUseCase.execute(
                frames,
                modelId
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result?.cost?.inputTokens ?? 0,
                result?.cost?.outputTokens ?? 0,
            );

            const response = {
                success: true,
                connections: result.connections,
                message: result.message,
                reasoning: result.reasoning,
                cost: result.cost,
                points,
            };

            res.status(200).json(response);

        } catch (error) {
            console.error('Error in generatePrototype:', error);

            const response = {
                success: false,
                connections: [],
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            };

            const statusCode = this.resolveErrorStatusCode(error);
            res.status(statusCode).json(response);
        }
    }

    private getUserId(req: Request): string {
        const user = (req as any).user;
        if (!user?.id) {
            throw new HttpError("Authentication required", 401);
        }
        return user.id;
    }

    private async ensureModelUsable(userId: string, modelId: string): Promise<void> {
        if (this.pointsService.isFreeModel(modelId)) {
            return;
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new HttpError("Authentication required", 401);
        }

        if (!user.hasPurchased) {
            throw new PaymentRequiredError("Purchase points to unlock paid AI models.");
        }

        const hasEnoughPoints = await this.pointsService.hasEnoughPoints(userId, ENV_CONFIG.MIN_PRE_FLIGHT_POINTS);
        if (!hasEnoughPoints) {
            throw new PaymentRequiredError("Insufficient points balance. Please buy points to continue.");
        }
    }

    private async applyPointsDeduction(
        userId: string,
        modelId: string,
        inputTokens: number,
        outputTokens: number,
    ): Promise<PointsResponse> {
        const wasFree = this.pointsService.isFreeModel(modelId);
        let deducted = 0;

        if (!wasFree) {
            try {
                deducted = await this.pointsService.deductForUsage(
                    userId,
                    modelId,
                    inputTokens,
                    outputTokens,
                );
            } catch (error) {
                const message = error instanceof Error ? error.message : "Insufficient points";
                if (message.toLowerCase().includes("insufficient")) {
                    throw new PaymentRequiredError("Insufficient points balance. Please buy points to continue.");
                }
                throw error;
            }
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new HttpError("Authentication required", 401);
        }

        return {
            deducted,
            remaining: user.pointsBalance,
            wasFree,
            hasPurchased: user.hasPurchased,
        };
    }

    private resolveErrorStatusCode(error: unknown): number {
        if (error instanceof HttpError) {
            return error.statusCode;
        }

        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("insufficient points") || message.includes("purchase points")) {
            return 402;
        }

        return 500;
    }

}
