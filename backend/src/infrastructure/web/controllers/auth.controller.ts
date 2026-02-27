// File: /backend/src/infrastructure/web/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { GoogleSignInUseCase } from '../../../application/use-cases/google-sign-in.use-case';
import { TokenStoreService } from '../../services/token-store.service';
import { ENV_CONFIG } from '../../config/env.config';

export class AuthController {
    constructor(
        private readonly googleSignInUseCase: GoogleSignInUseCase,
        private readonly tokenStoreService: TokenStoreService,
    ) { }

    googleAuth = async (req: Request, res: Response): Promise<void> => {
        try {
            const state = req.query.state as string;
            const authUrl = this.googleSignInUseCase.getAuthUrl(state);
            res.redirect(authUrl);
        } catch (error) {
            console.error('Error generating Google auth URL:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initiate Google authentication',
            });
        }
    };

    googleCallback = async (req: Request, res: Response): Promise<void> => {
        try {
            const code = req.query.code as string;
            const state = req.query.state as string;

            if (!code) {
                res.status(400).json({
                    success: false,
                    message: 'Authorization code is missing',
                });
                return;
            }

            const [pollingId, figmaUserId] = state ? state.split(':') : [undefined, undefined];

            const { token } = await this.googleSignInUseCase.execute(code, figmaUserId);

            if (pollingId) {
                this.tokenStoreService.storeToken(pollingId, token);
                res.redirect(ENV_CONFIG.REDIRECT_URL);
                return;
            }

            // No polling ID means invalid flow
            res.status(400).json({
                success: false,
                message: 'Invalid authentication flow. Please sign in through the Figma plugin.',
            });
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.redirect(ENV_CONFIG.REDIRECT_URL);
        }
    };

    pollToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const pollingId = req.query.id as string;
            if (!pollingId) {
                res.status(400).json({
                    success: false,
                    message: 'Polling ID is missing',
                });
                return;
            }

            const token = this.tokenStoreService.getToken(pollingId);
            if (!token) {
                res.status(404).json({
                    success: false,
                    message: 'Token not found or expired',
                });
                return;
            }

            res.json({
                success: true,
                token,
            });
        } catch (error) {
            console.error('Error polling token:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to poll token',
            });
        }
    };

    getMe = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                });
                return;
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    userName: user.userName,
                    email: user.email,
                    profilePicture: user.profilePicture,
                },
            });
        } catch (error) {
            console.error('Error getting user info:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user info',
            });
        }
    };
}