import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';

export class DeleteUILibraryProjectUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(projectId: string, userId: string): Promise<void> {
        await this.uiLibraryRepository.deleteProject(projectId, userId);
    }
}
