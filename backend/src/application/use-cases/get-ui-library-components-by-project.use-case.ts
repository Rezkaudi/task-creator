import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { UILibraryComponent } from '../../domain/entities/ui-library-component.entity';

export class GetUILibraryComponentsByProjectUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(projectId: string, userId: string): Promise<UILibraryComponent[]> {
        return this.uiLibraryRepository.findComponentsByProject(projectId, userId);
    }
}
