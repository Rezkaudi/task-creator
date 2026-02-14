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
            pointsBalance: 0,
            hasPurchased: false,
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

    async addPoints(userId: string, points: number): Promise<User> {
        const result = await this.repository.query(
            'UPDATE "users" SET "pointsBalance" = "pointsBalance" + $1 WHERE "id" = $2 RETURNING *',
            [points, userId],
        );

        if (!result || result.length === 0) {
            throw new Error("User not found while adding points");
        }

        return this.toUser(result[0] as UserEntity);
    }

    async deductPoints(userId: string, points: number): Promise<User> {
        const result = await this.repository.query(
            'UPDATE "users" SET "pointsBalance" = "pointsBalance" - $1 WHERE "id" = $2 AND "pointsBalance" >= $1 RETURNING *',
            [points, userId],
        );

        if (!result || result.length === 0) {
            throw new Error("Insufficient points balance");
        }

        return this.toUser(result[0] as UserEntity);
    }

    async setStripeCustomerId(userId: string, customerId: string): Promise<void> {
        await this.repository.query(
            'UPDATE "users" SET "stripeCustomerId" = $1 WHERE "id" = $2',
            [customerId, userId],
        );
    }

    async markHasPurchased(userId: string): Promise<void> {
        await this.repository.query(
            'UPDATE "users" SET "hasPurchased" = true WHERE "id" = $1',
            [userId],
        );
    }

    // In typeorm-user.repository.ts
    async findOrCreate(userData: Partial<User>): Promise<User> {
        return await AppDataSource.transaction(async (manager) => {
            const entityManager = manager.getRepository(UserEntity);

            // Use UserEntity, not User
            let userEntity = await entityManager.findOne({
                where: { figmaUserId: userData.figmaUserId },
                lock: { mode: 'pessimistic_write' }
            });

            if (!userEntity) {
                userEntity = entityManager.create({
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                    figmaUserId: userData.figmaUserId,
                    userName: userData.userName,
                    email: userData.email,
                    pointsBalance: 0,
                    hasPurchased: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await entityManager.save(userEntity);
            }

            return this.toUser(userEntity);
        });
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { googleId },
        });
        return entity ? this.toUser(entity) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { email },
        });
        return entity ? this.toUser(entity) : null;
    }

    async findOrCreateByGoogle(googleData: {
        googleId: string;
        email: string;
        userName: string;
        profilePicture?: string;
        figmaUserId?: string;
    }): Promise<User> {
        return await AppDataSource.transaction(async (manager) => {
            const entityManager = manager.getRepository(UserEntity);

            // First try to find by googleId
            let userEntity = await entityManager.findOne({
                where: { googleId: googleData.googleId },
                lock: { mode: 'pessimistic_write' },
            });

            if (userEntity) {
                // Update profile info and ensure real figmaUserId is stored
                userEntity.userName = googleData.userName;
                userEntity.email = googleData.email;
                userEntity.profilePicture = googleData.profilePicture;
                if (googleData.figmaUserId) {
                    userEntity.figmaUserId = googleData.figmaUserId;
                }
                userEntity.updatedAt = new Date();
                await entityManager.save(userEntity);
                return this.toUser(userEntity);
            }

            // Try to find by email and link the Google account
            userEntity = await entityManager.findOne({
                where: { email: googleData.email },
                lock: { mode: 'pessimistic_write' },
            });

            if (userEntity) {
                userEntity.googleId = googleData.googleId;
                userEntity.userName = googleData.userName;
                userEntity.profilePicture = googleData.profilePicture;
                if (googleData.figmaUserId) {
                    userEntity.figmaUserId = googleData.figmaUserId;
                }
                userEntity.updatedAt = new Date();
                await entityManager.save(userEntity);
                return this.toUser(userEntity);
            }

            // Create new user
            userEntity = entityManager.create({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                figmaUserId: googleData.figmaUserId || `google_${googleData.googleId}`,
                googleId: googleData.googleId,
                userName: googleData.userName,
                email: googleData.email,
                profilePicture: googleData.profilePicture,
                pointsBalance: 0,
                hasPurchased: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await entityManager.save(userEntity);
            return this.toUser(userEntity);
        });
    }

    private toUser(entity: UserEntity): User {
        return {
            id: entity.id,
            figmaUserId: entity.figmaUserId,
            userName: entity.userName,
            email: entity.email,
            googleId: entity.googleId,
            profilePicture: entity.profilePicture,
            pointsBalance: entity.pointsBalance ?? 0,
            stripeCustomerId: entity.stripeCustomerId,
            hasPurchased: entity.hasPurchased ?? false,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
