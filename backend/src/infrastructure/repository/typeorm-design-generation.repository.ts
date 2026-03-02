import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import {
    IDesignGenerationRepository,
    FindUserGenerationsOptions,
    PaginatedGenerations,
} from '../../domain/repositories/design-generation.repository';
import { DesignGeneration } from '../../domain/entities/design-generation.entity';
import { DesignGenerationEntity } from '../database/entities/design-generation.entity';

export class TypeORMDesignGenerationRepository implements IDesignGenerationRepository {
    private readonly repository: Repository<DesignGenerationEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(DesignGenerationEntity);
    }

    async create(generation: Omit<DesignGeneration, 'createdAt' | 'updatedAt'>): Promise<DesignGeneration> {
        const entity = this.repository.create({
            id: generation.id,
            userId: generation.userId,
            prompt: generation.prompt,
            operationType: generation.operationType,
            modelId: generation.modelId,
            designSystemId: generation.designSystemId ?? null,
            conversationHistory: generation.conversationHistory ?? null,
            currentDesign: generation.currentDesign ?? null,
            referenceDesign: generation.referenceDesign ?? null,
            resultDesign: generation.resultDesign ?? null,
            resultConnections: generation.resultConnections ?? null,
            aiMessage: generation.aiMessage ?? null,
            status: generation.status,
            errorMessage: generation.errorMessage ?? null,
            inputTokens: generation.inputTokens ?? null,
            outputTokens: generation.outputTokens ?? null,
            totalCost: generation.totalCost ?? null,
            pointsDeducted: generation.pointsDeducted ?? null,
        });

        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async findByUserId(userId: string, options: FindUserGenerationsOptions): Promise<PaginatedGenerations> {
        const { page, limit, operationType } = options;
        const skip = (page - 1) * limit;

        const whereClause: any = { userId };
        if (operationType) {
            whereClause.operationType = operationType;
        }

        const [items, total] = await this.repository.findAndCount({
            where: whereClause,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return {
            items: items.map((item) => this.toDomain(item)),
            total,
            page,
            limit,
        };
    }

    async findByIdAndUserId(id: string, userId: string): Promise<DesignGeneration | null> {
        const entity = await this.repository.findOne({ where: { id, userId } });
        return entity ? this.toDomain(entity) : null;
    }

    async deleteByIdAndUserId(id: string, userId: string): Promise<void> {
        await this.repository.delete({ id, userId });
    }

    private toDomain(entity: DesignGenerationEntity): DesignGeneration {
        return {
            id: entity.id,
            userId: entity.userId,
            prompt: entity.prompt,
            operationType: entity.operationType,
            modelId: entity.modelId,
            designSystemId: entity.designSystemId ?? undefined,
            conversationHistory: entity.conversationHistory ?? undefined,
            currentDesign: entity.currentDesign ?? undefined,
            referenceDesign: entity.referenceDesign ?? undefined,
            resultDesign: entity.resultDesign ?? undefined,
            resultConnections: entity.resultConnections ?? undefined,
            aiMessage: entity.aiMessage ?? undefined,
            status: entity.status,
            errorMessage: entity.errorMessage ?? undefined,
            inputTokens: entity.inputTokens ?? undefined,
            outputTokens: entity.outputTokens ?? undefined,
            totalCost: entity.totalCost ?? undefined,
            pointsDeducted: entity.pointsDeducted ?? undefined,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
