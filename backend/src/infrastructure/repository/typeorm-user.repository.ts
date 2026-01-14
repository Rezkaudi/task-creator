// File: /backend/src/infrastructure/repository/typeorm-user.repository.ts

import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { UserEntity } from "../database/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";

export class TypeORMUserRepository implements IUserRepository {
    private repository: Repository<UserEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserEntity);
    }

    async create(user: Partial<User>): Promise<User> {
        const entity = this.repository.create({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            figmaUserId: user.figmaUserId!,
            userName: user.userName,
            email: user.email,
        });

        const saved = await this.repository.save(entity);
        return this.toUser(saved);
    }

    async findByFigmaUserId(figmaUserId: string): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { figmaUserId },
        });
        return entity ? this.toUser(entity) : null;
    }

    async findById(id: string): Promise<User | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? this.toUser(entity) : null;
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
        await this.repository.update(id, user);
        return this.findById(id);
    }

    async findOrCreate(user: Partial<User>): Promise<User> {
        const existing = await this.findByFigmaUserId(user.figmaUserId!);
        if (existing) {
            return existing;
        }
        return this.create(user);
    }

    private toUser(entity: UserEntity): User {
        return {
            id: entity.id,
            figmaUserId: entity.figmaUserId,
            userName: entity.userName,
            email: entity.email,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}