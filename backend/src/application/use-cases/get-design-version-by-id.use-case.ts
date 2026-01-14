// File: /backend/src/application/use-cases/get-design-version-by-id.use-case.ts

import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class GetDesignVersionByIdUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(id: string, userId: string): Promise<DesignVersion | null> {
        return await this.designVersionRepository.findById(id, userId);
    }
}