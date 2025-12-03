import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class GetAllDesignVersionsUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(): Promise<DesignVersion[]> {
        return await this.designVersionRepository.findAll();
    }
}
