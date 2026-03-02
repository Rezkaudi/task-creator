import { DesignGeneration, DesignGenerationOperationType } from '../entities/design-generation.entity';

export interface FindUserGenerationsOptions {
    page: number;
    limit: number;
    operationType?: DesignGenerationOperationType;
}

export interface PaginatedGenerations {
    items: DesignGeneration[];
    total: number;
    page: number;
    limit: number;
}

export interface IDesignGenerationRepository {
    create(generation: Omit<DesignGeneration, 'createdAt' | 'updatedAt'>): Promise<DesignGeneration>;
    findByUserId(userId: string, options: FindUserGenerationsOptions): Promise<PaginatedGenerations>;
    findByIdAndUserId(id: string, userId: string): Promise<DesignGeneration | null>;
    deleteByIdAndUserId(id: string, userId: string): Promise<void>;
}
