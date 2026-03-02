import {
    IDesignGenerationRepository,
    FindUserGenerationsOptions,
    PaginatedGenerations,
} from '../../../domain/repositories/design-generation.repository';
import { DesignGenerationOperationType } from '../../../domain/entities/design-generation.entity';

export class GetUserGenerationsUseCase {
    constructor(private readonly designGenerationRepository: IDesignGenerationRepository) {}

    async execute(
        userId: string,
        page: number,
        limit: number,
        operationType?: DesignGenerationOperationType,
    ): Promise<PaginatedGenerations> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));

        const options: FindUserGenerationsOptions = {
            page: safePage,
            limit: safeLimit,
            operationType,
        };

        return this.designGenerationRepository.findByUserId(userId, options);
    }
}
