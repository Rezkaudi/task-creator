import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { UILibraryComponent } from '../../domain/entities/ui-library-component.entity';

export class CreateUILibraryComponentUseCase {
    constructor(private readonly uiLibraryRepository: IUILibraryRepository) {}

    async execute(input: {
        projectId: string;
        userId: string;
        name: string;
        description: string;
        designJson: any;
        previewImage?: string | null;
    }): Promise<UILibraryComponent> {
        const project = await this.uiLibraryRepository.findProjectById(input.projectId, input.userId);
        if (!project) {
            throw new Error('Project not found');
        }

        return this.uiLibraryRepository.createComponent(input);
    }
}
