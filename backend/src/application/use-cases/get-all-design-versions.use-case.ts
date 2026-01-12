// File: /backend/src/application/use-cases/get-all-design-versions.use-case.ts

import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class GetAllDesignVersionsUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(userId: string): Promise<DesignVersion[]> {
        return await this.designVersionRepository.findAll(userId);
    }
}