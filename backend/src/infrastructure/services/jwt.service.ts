// File: /backend/src/infrastructure/services/jwt.service.ts

import jwt from 'jsonwebtoken';
import { ENV_CONFIG } from '../config/env.config';

export interface JwtPayload {
    userId: string;
    email: string;
}

export class JwtService {
    private readonly secret: string;
    private readonly expiry: string;

    constructor() {
        this.secret = ENV_CONFIG.JWT_SECRET;
        this.expiry = ENV_CONFIG.JWT_EXPIRY;
    }

    sign(payload: JwtPayload): string {
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiry as any,
        } as jwt.SignOptions);
    }

    verify(token: string): JwtPayload | null {
        try {
            const decoded = jwt.verify(token, this.secret) as JwtPayload;
            return decoded;
        } catch {
            return null;
        }
    }
}
