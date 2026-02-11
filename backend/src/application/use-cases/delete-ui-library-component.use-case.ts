import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';

export class DeleteUILibraryComponentUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(componentId: string, userId: string): Promise<void> {
        await this.uiLibraryRepository.deleteComponent(componentId, userId);
    }
}
