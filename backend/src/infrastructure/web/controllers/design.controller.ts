import { Request, Response } from 'express';
import { GenerateDesignFromConversationUseCase } from '../../../application/use-cases/design/generate-design-from-conversation.use-case';
import { EditDesignWithAIUseCase } from '../../../application/use-cases/design/edit-design-with-ai.use-case';
import { GenerateDesignBasedOnExistingUseCase } from '../../../application/use-cases/design/generate-design-based-on-existing.use-case';
import { DesignGenerationResult } from '../../../domain/services/IAiDesignService';
import { GeneratePrototypeConnectionsUseCase } from '../../../application/use-cases/design/generate-prototype-connections.use-case';
import { IPointsService } from '../../../domain/services/IPointsService';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { ISubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { HttpError, PaymentRequiredError } from '../../../application/errors/http-errors';
import { ENV_CONFIG } from '../../config/env.config';
import { SaveDesignGenerationUseCase } from '../../../application/use-cases/design-generation/save-design-generation.use-case';

interface PointsResponse {
    deducted: number;
    remaining: number;
    wasFree: boolean;
    hasPurchased: boolean;
    subscription?: {
        dailyPointsUsed: number;
        dailyPointsLimit: number;
        planId?: string;
    };
}

export class DesignController {
    constructor(
        private readonly generateDesignFromConversationUseCase: GenerateDesignFromConversationUseCase,
        private readonly editDesignWithAIUseCase: EditDesignWithAIUseCase,
        private readonly generateDesignBasedOnExistingUseCase: GenerateDesignBasedOnExistingUseCase,
        private readonly generatePrototypeConnectionsUseCase: GeneratePrototypeConnectionsUseCase,
        private readonly pointsService: IPointsService,
        private readonly userRepository: IUserRepository,
        private readonly subscriptionRepository: ISubscriptionRepository,
        private readonly saveDesignGenerationUseCase: SaveDesignGenerationUseCase,
    ) { }

    // Generate design from conversation with history
    async generateFromConversation(req: Request, res: Response): Promise<void> {
        const { message, history, modelId, designSystemId, imageDataUrl } = req.body;

        try {
            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            const result: DesignGenerationResult = await this.generateDesignFromConversationUseCase.execute(
                message,
                history || [],
                modelId,
                designSystemId,
                imageDataUrl,
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result.cost?.inputTokens ?? 0,
                result.cost?.outputTokens ?? 0,
            );

            this.saveDesignGenerationUseCase.execute({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                userId,
                prompt: message,
                operationType: 'create',
                modelId,
                designSystemId: designSystemId ?? null,
                conversationHistory: history || [],
                resultDesign: result.design ?? null,
                status: 'success',
                inputTokens: result.cost?.inputTokens ?? null,
                outputTokens: result.cost?.outputTokens ?? null,
                totalCost: result.cost?.totalCost ?? null,
                pointsDeducted: points.deducted,
            }).catch(console.error);

            res.status(200).json({
                success: true,
                design: result.design,
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

            try {
                const userId = (req as any).user?.id;
                if (userId) {
                    this.saveDesignGenerationUseCase.execute({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                        userId,
                        prompt: req.body.message,
                        operationType: 'create',
                        modelId,
                        designSystemId: designSystemId ?? null,
                        conversationHistory: req.body.history || [],
                        status: 'failed',
                        errorMessage: message,
                    }).catch(console.error);
                }
            } catch { /* ignore */ }

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

            this.saveDesignGenerationUseCase.execute({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                userId,
                prompt: message,
                operationType: 'edit',
                modelId,
                designSystemId: designSystemId ?? null,
                conversationHistory: history || [],
                currentDesign: currentDesign ?? null,
                resultDesign: result.design ?? null,
                status: 'success',
                inputTokens: result.cost?.inputTokens ?? null,
                outputTokens: result.cost?.outputTokens ?? null,
                totalCost: result.cost?.totalCost ?? null,
                pointsDeducted: points.deducted,
            }).catch(console.error);

            res.status(200).json({
                success: true,
                design: result.design,
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

            try {
                const userId = (req as any).user?.id;
                if (userId) {
                    this.saveDesignGenerationUseCase.execute({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                        userId,
                        prompt: req.body.message,
                        operationType: 'edit',
                        modelId,
                        designSystemId: designSystemId ?? null,
                        status: 'failed',
                        errorMessage: message,
                    }).catch(console.error);
                }
            } catch { /* ignore */ }

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
        const { message, history, referenceDesigns, modelId, pinnedComponentNames } = req.body;

        try {

            const userId = this.getUserId(req);
            await this.ensureModelUsable(userId, modelId);

            // referenceDesigns is an array of all references — buildReferenceContext handles arrays natively
            const allReferences = Array.isArray(referenceDesigns) && referenceDesigns.length > 0
                ? referenceDesigns
                : referenceDesigns; // fallback (should always be array)

            const result: DesignGenerationResult = await this.generateDesignBasedOnExistingUseCase.execute(
                message,
                history || [],
                allReferences,
                modelId,
                Array.isArray(pinnedComponentNames) ? pinnedComponentNames : undefined
            );

            const points = await this.applyPointsDeduction(
                userId,
                modelId,
                result.cost?.inputTokens ?? 0,
                result.cost?.outputTokens ?? 0,
            );

            this.saveDesignGenerationUseCase.execute({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                userId,
                prompt: message,
                operationType: 'create_by_reference',
                modelId,
                conversationHistory: history || [],
                referenceDesign: Array.isArray(referenceDesigns) ? referenceDesigns[0] ?? null : null,
                resultDesign: result.design ?? null,
                status: 'success',
                inputTokens: result.cost?.inputTokens ?? null,
                outputTokens: result.cost?.outputTokens ?? null,
                totalCost: result.cost?.totalCost ?? null,
                pointsDeducted: points.deducted,
            }).catch(console.error);

            res.status(200).json({
                success: true,
                design: result.design,
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

            try {
                const userId = (req as any).user?.id;
                if (userId) {
                    this.saveDesignGenerationUseCase.execute({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                        userId,
                        prompt: req.body.message,
                        operationType: 'create_by_reference',
                        modelId,
                        status: 'failed',
                        errorMessage: message,
                    }).catch(console.error);
                }
            } catch { /* ignore */ }

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

            this.saveDesignGenerationUseCase.execute({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                userId,
                prompt: 'prototype',
                operationType: 'prototype',
                modelId,
                resultConnections: result.connections ?? null,
                status: 'success',
                inputTokens: result?.cost?.inputTokens ?? null,
                outputTokens: result?.cost?.outputTokens ?? null,
                totalCost: result?.cost?.totalCost ?? null,
                pointsDeducted: points.deducted,
            }).catch(console.error);

            const response = {
                success: true,
                connections: result.connections,
                cost: result.cost,
                points,
            };

            res.status(200).json(response);

        } catch (error) {
            console.error('Error in generatePrototype:', error);

            try {
                const userId = (req as any).user?.id;
                if (userId) {
                    this.saveDesignGenerationUseCase.execute({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                        userId,
                        prompt: 'prototype',
                        operationType: 'prototype',
                        modelId: req.body.modelId,
                        status: 'failed',
                        errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred',
                    }).catch(console.error);
                }
            } catch { /* ignore */ }

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

        // Check active subscription first
        const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
        if (subscription) {
            const today = new Date().toISOString().split("T")[0];
            const currentUsage = subscription.lastUsageResetDate === today
                ? subscription.dailyPointsUsed
                : 0;

            const remainingQuota = subscription.dailyPointsLimit - currentUsage;
            if (remainingQuota >= ENV_CONFIG.MIN_PRE_FLIGHT_POINTS) {
                return; // Subscription allows this request
            }

            // Daily limit reached — fall through to points check
        }

        if (!user.hasPurchased) {
            throw new PaymentRequiredError("Purchase credits to unlock paid AI models.");
        }

        const hasEnoughPoints = await this.pointsService.hasEnoughPoints(userId, ENV_CONFIG.MIN_PRE_FLIGHT_POINTS);
        if (!hasEnoughPoints) {
            if (subscription) {
                throw new PaymentRequiredError(
                    `Daily limit of ${subscription.dailyPointsLimit} credits reached. Buy credits for additional usage.`
                );
            }
            throw new PaymentRequiredError("Insufficient credits balance. Please buy credits to continue.");
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
            // Calculate points cost
            const pointsToDeduct = this.pointsService.calculatePointsCost(modelId, inputTokens, outputTokens);

            // Check if user has an active subscription with remaining daily quota
            const subscription = await this.subscriptionRepository.findActiveByUserId(userId);
            if (subscription) {
                const today = new Date().toISOString().split("T")[0];
                const currentUsage = subscription.lastUsageResetDate === today
                    ? subscription.dailyPointsUsed
                    : 0;

                const remainingQuota = subscription.dailyPointsLimit - currentUsage;
                if (remainingQuota >= pointsToDeduct) {
                    // Use subscription quota instead of points
                    const { dailyPointsUsed } = await this.subscriptionRepository.incrementDailyPointsUsed(subscription.id, pointsToDeduct);
                    const user = await this.userRepository.findById(userId);
                    if (!user) {
                        throw new HttpError("Authentication required", 401);
                    }

                    const pointsResponse = {
                        deducted: 0,
                        remaining: user.pointsBalance,
                        wasFree: false,
                        hasPurchased: user.hasPurchased,
                        subscription: {
                            dailyPointsUsed,
                            dailyPointsLimit: subscription.dailyPointsLimit,
                            planId: subscription.planId,
                        },
                    };
                    console.log('[applyPointsDeduction] Returning subscription with dailyPointsUsed:', dailyPointsUsed);
                    return pointsResponse;
                }
            }

            // Fall back to points deduction
            try {
                deducted = await this.pointsService.deductForUsage(
                    userId,
                    modelId,
                    inputTokens,
                    outputTokens,
                );
            } catch (error) {
                const message = error instanceof Error ? error.message : "Insufficient credits";
                if (message.toLowerCase().includes("insufficient")) {
                    throw new PaymentRequiredError("Insufficient credits balance. Please buy credits to continue.");
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
        if (message.includes("insufficient credits") || message.includes("purchase credits") || message.includes("daily limit")) {
            return 402;
        }

        return 500;
    }

}
