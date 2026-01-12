// File: /backend/src/domain/repositories/user.repository.ts

import { User } from "../entities/user.entity";

export interface IUserRepository {
    create(user: Partial<User>): Promise<User>;
    findByFigmaUserId(figmaUserId: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(id: string, user: Partial<User>): Promise<User | null>;
}