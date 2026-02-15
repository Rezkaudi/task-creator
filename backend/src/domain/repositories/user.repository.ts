// File: /backend/src/domain/repositories/user.repository.ts

import { User } from "../entities/user.entity";

export interface IUserRepository {
    create(user: Partial<User>): Promise<User>;
    findByFigmaUserId(figmaUserId: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(id: string, user: Partial<User>): Promise<User | null>;
    addPoints(userId: string, points: number): Promise<User>;
    deductPoints(userId: string, points: number): Promise<User>;
    setStripeCustomerId(userId: string, customerId: string): Promise<void>;
    markHasPurchased(userId: string): Promise<void>;
    findOrCreateByGoogle(googleData: {
        googleId: string;
        email: string;
        userName: string;
        profilePicture?: string;
        figmaUserId?: string;
    }): Promise<User>;
}
