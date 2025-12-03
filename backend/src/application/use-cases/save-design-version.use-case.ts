import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class SaveDesignVersionUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(description: string, designJson: any): Promise<DesignVersion> {

        const nextVersion = await this.designVersionRepository.getNextVersion();

        const designVersion = await this.designVersionRepository.create({
            version: nextVersion,
            description,
            designJson,
        });

        return designVersion;
    }
}
