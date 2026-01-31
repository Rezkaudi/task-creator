// File: /backend/src/infrastructure/repository/typeorm-client-error.repository.ts

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { ClientErrorEntity } from "../database/entities/client-error.entity";
import { IClientErrorRepository } from "../../domain/repositories/client-error.repository";
import { ClientError } from "../../domain/entities/client-error.entity";

export class TypeORMClientErrorRepository implements IClientErrorRepository {
    private repository: Repository<ClientErrorEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(ClientErrorEntity);
    }

    async create(error: Partial<ClientError>): Promise<ClientError> {
        const entity = this.repository.create({
            id: `err_${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            figmaUserId: error.figmaUserId,
            userName: error.userName,
            errorCode: error.errorCode,
            errorMessage: error.errorMessage!,
            errorStack: error.errorStack,
            errorDetails: error.errorDetails,
            pluginVersion: error.pluginVersion,
            figmaVersion: error.figmaVersion,
            platform: error.platform,
            browserInfo: error.browserInfo,
            componentName: error.componentName,
            actionType: error.actionType,
        });

        const saved = await this.repository.save(entity);
        return this.toClientError(saved);
    }

    async findAll(limit: number = 100, offset: number = 0): Promise<ClientError[]> {
        const entities = await this.repository.find({
            order: { createdAt: "DESC" },
            take: limit,
            skip: offset,
        });
        return entities.map(this.toClientError);
    }

    async findByfigmaUserId(figmaUserId: string, limit: number = 50): Promise<ClientError[]> {
        const entities = await this.repository.find({
            where: { figmaUserId },
            order: { createdAt: "DESC" },
            take: limit,
        });
        return entities.map(this.toClientError);
    }

    async findById(id: string): Promise<ClientError | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toClientError(entity) : null;
    }

    async countByfigmaUserId(figmaUserId: string): Promise<number> {
        return await this.repository.count({ where: { figmaUserId } });
    }

    async countAll(): Promise<number> {
        return await this.repository.count();
    }

    private toClientError(entity: ClientErrorEntity): ClientError {
        return {
            id: entity.id,
            figmaUserId: entity.figmaUserId,
            userName: entity.userName,
            errorCode: entity.errorCode,
            errorMessage: entity.errorMessage,
            errorStack: entity.errorStack,
            errorDetails: entity.errorDetails,
            pluginVersion: entity.pluginVersion,
            figmaVersion: entity.figmaVersion,
            platform: entity.platform,
            browserInfo: entity.browserInfo,
            componentName: entity.componentName,
            actionType: entity.actionType,
            createdAt: entity.createdAt,
        };
    }
}