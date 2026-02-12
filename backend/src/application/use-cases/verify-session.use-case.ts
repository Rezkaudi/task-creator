// File: /backend/src/application/use-cases/verify-session.use-case.ts

import { IAuthService } from '../../domain/services/auth.service';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

export class VerifySessionUseCase {
    constructor(
        private readonly authService: IAuthService,
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(token: string): Promise<User | null> {
        const payload = this.authService.verifyToken(token);
        if (!payload) {
            return null;
        }

        const user = await this.userRepository.findById(payload.userId);
        return user;
    }
}
