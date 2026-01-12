// File: /backend/src/application/use-cases/save-design-version.use-case.ts

import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class SaveDesignVersionUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(description: string, designJson: any, userId: string): Promise<DesignVersion> {
        const nextVersion = await this.designVersionRepository.getNextVersion(userId);

        const designVersion = await this.designVersionRepository.create({
            version: nextVersion,
            description,
            designJson,
            userId,
        });

        return designVersion;
    }
}