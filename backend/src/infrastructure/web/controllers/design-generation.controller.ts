import { Request, Response } from 'express';
import { GetUserGenerationsUseCase } from '../../../application/use-cases/design-generation/get-user-generations.use-case';
import { GetGenerationByIdUseCase } from '../../../application/use-cases/design-generation/get-generation-by-id.use-case';
import { DeleteGenerationUseCase } from '../../../application/use-cases/design-generation/delete-generation.use-case';
import { DesignGenerationOperationType } from '../../../domain/entities/design-generation.entity';

export class DesignGenerationController {
    constructor(
        private readonly getUserGenerationsUseCase: GetUserGenerationsUseCase,
        private readonly getGenerationByIdUseCase: GetGenerationByIdUseCase,
        private readonly deleteGenerationUseCase: DeleteGenerationUseCase,
    ) {}

    async getUserGenerations(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const page = parseInt(String(req.query.page ?? '1'), 10);
            const limit = parseInt(String(req.query.limit ?? '20'), 10);
            const operationType = req.query.operationType as DesignGenerationOperationType | undefined;

            const result = await this.getUserGenerationsUseCase.execute(userId, page, limit, operationType);

            res.status(200).json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch generations';
            res.status(500).json({ success: false, message });
        }
    }

    async getGenerationById(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const generation = await this.getGenerationByIdUseCase.execute(id, userId);

            res.status(200).json({ success: true, generation });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch generation';
            const statusCode = message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({ success: false, message });
        }
    }

    async deleteGeneration(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await this.deleteGenerationUseCase.execute(id, userId);

            res.status(200).json({ success: true, message: 'Generation deleted successfully' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete generation';
            const statusCode = message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({ success: false, message });
        }
    }
}
