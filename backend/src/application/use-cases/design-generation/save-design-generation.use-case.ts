import { IDesignGenerationRepository } from '../../../domain/repositories/design-generation.repository';
import { DesignGeneration } from '../../../domain/entities/design-generation.entity';

export class SaveDesignGenerationUseCase {
    constructor(private readonly designGenerationRepository: IDesignGenerationRepository) {}

    async execute(generation: Omit<DesignGeneration, 'createdAt' | 'updatedAt'>): Promise<void> {
        await this.designGenerationRepository.create(generation);
    }
}
