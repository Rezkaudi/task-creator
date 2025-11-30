import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";

export class DeleteDesignVersionUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(id: number): Promise<void> {
        const version = await this.designVersionRepository.findById(id);
        if (!version) {
            throw new Error(`Design version with id ${id} not found`);
        }
        await this.designVersionRepository.delete(id);
    }
}
