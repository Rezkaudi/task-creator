// File: /backend/src/infrastructure/web/middleware/user.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { TypeORMUserRepository } from '../../repository/typeorm-user.repository';

export class UserMiddleware {
    private userRepository: TypeORMUserRepository;

    constructor(userRepository: TypeORMUserRepository) {
        this.userRepository = userRepository;
    }

    async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Skip for public endpoints
            const publicPaths = [
                '/',
                '/health',
                '/docs',
                '/api',
                '/api/docs',
                '/api/errors',  // Allow error reporting without authentication
                'api/tasks/extract',
                // '/api/ai-models',
                // '/api/design-systems'
            ];

            // Skip for auth routes (handled by auth controller)
            if (req.path.startsWith('/auth')) {
                return next();
            }

            if (publicPaths.some(path => req.path === path)) {
                return next();
            }

            // Check if user was already set by AuthMiddleware (JWT/cookie auth)
            if ((req as any).user) {
                console.log(`👤 User ${(req as any).user.userName || (req as any).user.email} (ID: ${(req as any).user.id}) accessed ${req.method} ${req.path} [JWT auth]`);
                return next();
            }

            // Fall back to Figma header-based auth
            const figmaUserId = req.headers['x-figma-user-id'] as string;
            const rawUserName = req.headers['x-figma-user-name'] as string;
            const rawUserEmail = req.headers['x-figma-user-email'] as string;

            // Decode URL-encoded header values
            const userName = rawUserName ? decodeURIComponent(rawUserName) : undefined;
            const userEmail = rawUserEmail ? decodeURIComponent(rawUserEmail) : undefined;

            // For Figma plugin requests (from manifest.json)
            const pluginOrigin = req.headers['origin'];
            const isFromFigma = pluginOrigin?.includes('figma.com') ||
                pluginOrigin === 'null' ||
                pluginOrigin === 'chrome-extension://';

            // If it's from Figma plugin but no headers, try to get from body
            let finalFigmaUserId = figmaUserId;
            let finalUserName = userName;

            if (isFromFigma && !finalFigmaUserId && req.body) {
                finalFigmaUserId = req.body.figmaUserId || req.body.userId;
                finalUserName = req.body.userName || req.body.name;
            }

            if (!finalFigmaUserId) {
                console.warn('No Figma User ID found in request:', {
                    path: req.path,
                    method: req.method,
                    headers: req.headers,
                    body: req.body
                });

                // For some endpoints, we might want to proceed without user (e.g., public APIs)
                // But for design version endpoints, we require user
                const requiresUser = req.path.includes('/design-versions') ||
                    req.path.includes('/tasks') ||
                    req.path.includes('/designs');

                if (requiresUser) {
                    res.status(401).json({
                        success: false,
                        message: 'Authentication required. Please sign in with Google or provide Figma user credentials.',
                    });
                    return;
                } else {
                    // For non-user-specific endpoints, continue without user
                    return next();
                }
            }

            // Auto-register or get existing user
            const user = await this.userRepository.findOrCreate({
                figmaUserId: finalFigmaUserId,
                userName: finalUserName,
                email: userEmail,
            });

            // Log successful registration/login
            console.log(`👤 User ${user.userName || user.figmaUserId} (ID: ${user.id}) accessed ${req.method} ${req.path} [Figma header auth]`);

            // Attach user to request
            (req as any).user = user;
            next();

        } catch (error) {
            console.error('Error in user middleware:', error);

            // Don't block the request in case of DB errors for non-critical endpoints
            const isCritical = req.path.includes('/design-versions') ||
                req.path.includes('/tasks');

            if (isCritical) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to authenticate user. Please try again.',
                    error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
                });
            } else {
                // For non-critical endpoints, continue without user
                next();
            }
        }
    }
}