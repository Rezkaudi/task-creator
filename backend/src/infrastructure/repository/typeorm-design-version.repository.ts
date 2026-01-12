// File: /backend/src/infrastructure/repository/typeorm-design-version.repository.ts

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { DesignVersionEntity } from "../database/entities/design-version.entity";
import { IDesignVersionRepository } from "../../domain/repositories/design-version.repository";
import { DesignVersion } from "../../domain/entities/design-version.entity";

export class TypeORMDesignVersionRepository implements IDesignVersionRepository {
    private repository: Repository<DesignVersionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(DesignVersionEntity);
    }

    async create(designVersion: Partial<DesignVersion>): Promise<DesignVersion> {
        const entity = this.repository.create({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            version: designVersion.version!,
            description: designVersion.description!,
            designJson: designVersion.designJson,
            userId: designVersion.userId!,
        });

        const saved = await this.repository.save(entity);
        return this.toDesignVersion(saved);
    }

    async findAll(userId?: string): Promise<DesignVersion[]> {
        const where: any = {};
        if (userId) {
            where.user = { id: userId };
        }

        const entities = await this.repository.find({
            where,
            relations: ["user"],
            order: { version: "DESC" },
        });
        return entities.map(this.toDesignVersion);
    }

    async findById(id: string, userId?: string): Promise<DesignVersion | null> {
        const where: any = { id };
        if (userId) {
            where.user = { id: userId };
        }

        const entity = await this.repository.findOne({
            where,
            relations: ["user"],
        });
        return entity ? this.toDesignVersion(entity) : null;
    }

    async findLatest(userId?: string): Promise<DesignVersion | null> {
        const where: any = {};
        if (userId) {
            where.user = { id: userId };
        }

        const entity = await this.repository.findOne({
            where,
            relations: ["user"],
            order: { version: "DESC" },
        });
        return entity ? this.toDesignVersion(entity) : null;
    }

    async getNextVersion(userId?: string): Promise<number> {
        const latest = await this.findLatest(userId);
        return latest ? latest.version + 1 : 1;
    }

    async delete(id: string, userId?: string): Promise<void> {
        const where: any = { id };
        if (userId) {
            where.user = { id: userId };
        }
        await this.repository.delete(where);
    }

    private toDesignVersion(entity: DesignVersionEntity): DesignVersion {
        return {
            id: entity.id,
            version: entity.version,
            description: entity.description,
            designJson: entity.designJson,
            userId: entity.userId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}