// File: /backend/src/application/use-cases/delete-design-version.use-case.ts

import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";

export class DeleteDesignVersionUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(id: string, userId: string): Promise<void> {
        const version = await this.designVersionRepository.findById(id, userId);
        if (!version) {
            throw new Error(`Design version with id ${id} not found or you don't have permission to access it`);
        }
        await this.designVersionRepository.delete(id, userId);
    }
}