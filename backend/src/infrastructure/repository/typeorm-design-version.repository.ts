import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { DesignVersionEntity } from "../database/entities/design-version.typeorm-entity";
import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class TypeORMDesignVersionRepository implements IDesignVersionRepository {
    private repository: Repository<DesignVersionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(DesignVersionEntity);
    }

    async create(designVersion: Partial<DesignVersion>): Promise<DesignVersion> {
        const entity = this.repository.create({
            version: designVersion.version!,
            description: designVersion.description!,
            designJson: designVersion.designJson,
        });

        const saved = await this.repository.save(entity);
        return this.toDesignVersion(saved);
    }

    async findAll(): Promise<DesignVersion[]> {
        const entities = await this.repository.find({
            order: { version: "DESC" },
        });
        return entities.map(this.toDesignVersion);
    }

    async findById(id: number): Promise<DesignVersion | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toDesignVersion(entity) : null;
    }

    async findLatest(): Promise<DesignVersion | null> {
        const entity = await this.repository.findOne({
            order: { version: "DESC" },
            where: {},
        });
        return entity ? this.toDesignVersion(entity) : null;
    }

    async getNextVersion(): Promise<number> {
        const latest = await this.findLatest();
        return latest ? latest.version + 1 : 1;

    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id);
    }

    private toDesignVersion(entity: DesignVersionEntity): DesignVersion {
        return {
            id: entity.id,
            version: entity.version,
            description: entity.description,
            designJson: entity.designJson,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
