import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { UILibraryProject } from '../../domain/entities/ui-library-project.entity';

export class CreateUILibraryProjectUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(name: string, userId: string): Promise<UILibraryProject> {
        return this.uiLibraryRepository.createProject({ name, userId });
    }
}
