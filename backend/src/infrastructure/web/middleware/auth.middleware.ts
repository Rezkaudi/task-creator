// File: /backend/src/infrastructure/web/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../services/jwt.service';
import { TypeORMUserRepository } from '../../repository/typeorm-user.repository';

export class AuthMiddleware {
    private readonly jwtService: JwtService;
    private readonly userRepository: TypeORMUserRepository;

    constructor(userRepository: TypeORMUserRepository, jwtService: JwtService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    async handle(req: Request, _res: Response, next: NextFunction): Promise<void> {
        try {
            const token = this.extractToken(req);
            if (!token) {
                return next();
            }

            const payload = this.jwtService.verify(token);
            if (!payload) {
                return next();
            }

            const user = await this.userRepository.findById(payload.userId);
            if (user) {
                (req as any).user = user;
                (req as any).authToken = token;
            }
        } catch (error) {
            console.warn('Auth middleware error:', error);
        }

        next();
    }

    requireAuth(req: Request, res: Response, next: NextFunction): void {
        if (!(req as any).user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        next();
    }

    requireAuthForApi(req: Request, res: Response, next: NextFunction): void {
        const publicPaths = [
            '/payments/packages',
            '/payments/packages/',
            '/payments/webhook',
            '/payments/webhook/',
            '/subscriptions/plans',
            '/subscriptions/plans/'
        ];

        const isPublicPath = publicPaths.includes(req.path);

        if (isPublicPath) {
            next();
            return;
        }

        this.requireAuth(req, res, next);
    }

    private extractToken(req: Request): string | null {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }
}
