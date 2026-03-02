import { IDesignGenerationRepository } from '../../../domain/repositories/design-generation.repository';

export class DeleteGenerationUseCase {
    constructor(private readonly designGenerationRepository: IDesignGenerationRepository) {}

    async execute(id: string, userId: string): Promise<void> {
        const generation = await this.designGenerationRepository.findByIdAndUserId(id, userId);
        if (!generation) {
            throw new Error('Generation not found');
        }
        await this.designGenerationRepository.deleteByIdAndUserId(id, userId);
    }
}
