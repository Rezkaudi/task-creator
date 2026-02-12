// File: /backend/src/infrastructure/web/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../../services/jwt.service';
import { TypeORMUserRepository } from '../../repository/typeorm-user.repository';

export class AuthMiddleware {
    private readonly jwtService: JwtService;
    private readonly userRepository: TypeORMUserRepository;

    constructor(userRepository: TypeORMUserRepository) {
        this.jwtService = new JwtService();
        this.userRepository = userRepository;
    }

    /**
     * Middleware that verifies JWT from cookie or Authorization header.
     * If valid, attaches user to request. If not, continues without blocking
     * (the downstream middleware/controller decides whether auth is required).
     */
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

    /**
     * Middleware that ensures user is authenticated.
     * Should be used AFTER AuthMiddleware.handle.
     */
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

    private extractToken(req: Request): string | null {
        // Check HTTP-only cookie first
        const cookieToken = (req as any).cookies?.rio_token;
        if (cookieToken) return cookieToken;

        // Fall back to Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return null;
    }
}
