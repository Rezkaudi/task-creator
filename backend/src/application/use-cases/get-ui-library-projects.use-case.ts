import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { UILibraryProject } from '../../domain/entities/ui-library-project.entity';

export class GetUILibraryProjectsUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(userId: string): Promise<UILibraryProject[]> {
        return this.uiLibraryRepository.findProjects(userId);
    }
}
