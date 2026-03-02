import { IDesignGenerationRepository } from '../../../domain/repositories/design-generation.repository';
import { DesignGeneration } from '../../../domain/entities/design-generation.entity';

export class GetGenerationByIdUseCase {
    constructor(private readonly designGenerationRepository: IDesignGenerationRepository) {}

    async execute(id: string, userId: string): Promise<DesignGeneration> {
        const generation = await this.designGenerationRepository.findByIdAndUserId(id, userId);
        if (!generation) {
            throw new Error('Generation not found');
        }
        return generation;
    }
}
