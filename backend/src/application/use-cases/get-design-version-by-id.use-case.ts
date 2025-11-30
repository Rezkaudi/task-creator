import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class GetDesignVersionByIdUseCase {
    constructor(
        private readonly designVersionRepository: IDesignVersionRepository
    ) { }

    async execute(id: number): Promise<DesignVersion | null> {
        return await this.designVersionRepository.findById(id);
    }
}
