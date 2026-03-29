import { IUILibraryRepository } from '../../../domain/repositories/ui-library.repository';

export class DeleteUILibraryProjectUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(projectId: string, userId: string): Promise<void> {
        const project = await this.uiLibraryRepository.findProjectById(projectId, userId);
        if (!project) {
            throw new Error('Project not found');
        }
        await this.uiLibraryRepository.deleteProject(projectId, userId);
    }
}
