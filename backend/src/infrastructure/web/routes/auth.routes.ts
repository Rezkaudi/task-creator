// File: /backend/src/infrastructure/web/routes/auth.routes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export default function authRoutes(authController: AuthController): Router {
    const router = Router();

    router.get('/google', authController.googleAuth);
    router.get('/google/callback', authController.googleCallback);
    router.get('/poll', authController.pollToken);
    router.get('/me', authController.getMe);

    return router;
}
