import { IUILibraryRepository } from '../../domain/repositories/ui-library.repository';
import { S3Service } from '../../infrastructure/services/s3.service';

export class DeleteUILibraryComponentUseCase {
    constructor(
        private readonly uiLibraryRepository: IUILibraryRepository,
        private readonly s3Service: S3Service,
    ) {}

    async execute(componentId: string, userId: string): Promise<void> {
        const component = await this.uiLibraryRepository.findComponentById(componentId, userId);

        await this.uiLibraryRepository.deleteComponent(componentId, userId);

        if (component?.previewImage) {
            try {
                await this.s3Service.deleteImageByUrl(component.previewImage);
            } catch {
                // S3 deletion is best-effort — don't fail the request if it errors
            }
        }
    }
}
