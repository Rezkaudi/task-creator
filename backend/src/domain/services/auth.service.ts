// File: /backend/src/domain/services/auth.service.ts

import { User } from "../entities/user.entity";

export interface GoogleUserInfo {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
}

export interface IAuthService {
    getGoogleAuthUrl(state?: string): string;
    getGoogleUserInfo(code: string): Promise<GoogleUserInfo>;
    generateToken(user: User): string;
    verifyToken(token: string): { userId: string; email: string } | null;
}
