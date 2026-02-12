// File: /backend/src/application/use-cases/google-sign-in.use-case.ts

import { IAuthService } from '../../domain/services/auth.service';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

export interface GoogleSignInResult {
    user: User;
    token: string;
}

export class GoogleSignInUseCase {
    constructor(
        private readonly authService: IAuthService,
        private readonly userRepository: IUserRepository,
    ) { }

    getAuthUrl(state?: string): string {
        return this.authService.getGoogleAuthUrl(state);
    }

    async execute(code: string, figmaUserId?: string): Promise<GoogleSignInResult> {
        // Get user info from Google
        const googleUser = await this.authService.getGoogleUserInfo(code);

        // Find or create user in our database
        const user = await this.userRepository.findOrCreateByGoogle({
            googleId: googleUser.googleId,
            email: googleUser.email,
            userName: googleUser.name,
            profilePicture: googleUser.picture,
            figmaUserId: figmaUserId,
        });

        // Generate JWT token
        const token = this.authService.generateToken(user);

        return { user, token };
    }
}
