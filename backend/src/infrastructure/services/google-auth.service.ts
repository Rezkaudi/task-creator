// File: /backend/src/infrastructure/services/google-auth.service.ts

import { OAuth2Client } from 'google-auth-library';
import { ENV_CONFIG } from '../config/env.config';
import { IAuthService, GoogleUserInfo } from '../../domain/services/auth.service';
import { User } from '../../domain/entities/user.entity';
import { JwtService } from './jwt.service';

export class GoogleAuthService implements IAuthService {
    private readonly oauthClient: OAuth2Client;
    private readonly jwtService: JwtService;

    constructor() {
        this.oauthClient = new OAuth2Client(
            ENV_CONFIG.GOOGLE_CLIENT_ID,
            ENV_CONFIG.GOOGLE_CLIENT_SECRET,
            ENV_CONFIG.GOOGLE_CALLBACK_URL
        );
        this.jwtService = new JwtService();
    }

    getGoogleAuthUrl(state?: string): string {
        return this.oauthClient.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ],
            prompt: 'consent',
            state,
        });
    }

    async getGoogleUserInfo(code: string): Promise<GoogleUserInfo> {
        const { tokens } = await this.oauthClient.getToken(code);
        this.oauthClient.setCredentials(tokens);

        const ticket = await this.oauthClient.verifyIdToken({
            idToken: tokens.id_token!,
            audience: ENV_CONFIG.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Failed to get user info from Google');
        }

        return {
            googleId: payload.sub,
            email: payload.email!,
            name: payload.name || payload.email!,
            picture: payload.picture,
        };
    }

    generateToken(user: User): string {
        return this.jwtService.sign({
            userId: user.id,
            email: user.email || '',
        });
    }

    verifyToken(token: string): { userId: string; email: string } | null {
        return this.jwtService.verify(token);
    }
}
