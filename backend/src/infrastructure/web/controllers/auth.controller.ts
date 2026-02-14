// File: /backend/src/infrastructure/web/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleSignInUseCase } from '../../../application/use-cases/google-sign-in.use-case';
import { VerifySessionUseCase } from '../../../application/use-cases/verify-session.use-case';
import { ENV_CONFIG } from '../../config/env.config';

import { TokenStoreService } from '../../services/token-store.service';

const PAGES_DIR = join(__dirname, '../../../../public/pages');

export class AuthController {
    constructor(
        private readonly googleSignInUseCase: GoogleSignInUseCase,
        private readonly verifySessionUseCase: VerifySessionUseCase,
        private readonly tokenStoreService: TokenStoreService,
    ) { }

    /**
     * GET /auth/google
     * Redirects to Google OAuth consent screen
     */
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

    /**
     * GET /auth/google/callback
     * Handles the Google OAuth callback
     * Sets HTTP-only cookie and serves HTML page with token for Figma plugin
     */
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

            const { user, token } = await this.googleSignInUseCase.execute(code, figmaUserId);

            // Set HTTP-only cookie for web frontend
            const isProduction = ENV_CONFIG.NODE_ENV === 'production';
            res.cookie('rio_token', token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/',
            });

            // If pollingId is present, store token and serve "Success" page
            if (pollingId) {
                this.tokenStoreService.storeToken(pollingId, token);
                res.send(this.renderPage('polling-success.html', { userName: user.userName || user.email || 'User' }));
                return;
            }

            // Fallback for manual flow (if any) or web login
            res.send(this.renderPage('callback.html', { token, userName: user.userName || user.email || 'User' }));
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.send(this.renderPage('error.html', { errorMessage: (error as Error).message }));
        }
    };

    /**
     * GET /auth/poll
     * Polls for the token using the pollingId
     */
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

    /**
     * GET /auth/me
     * Returns current authenticated user
     */
    getMe = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = this.extractToken(req);
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                });
                return;
            }

            const user = await this.verifySessionUseCase.execute(token);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session',
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

    /**
     * POST /auth/logout
     * Clears the auth cookie
     */
    logout = async (_req: Request, res: Response): Promise<void> => {
        const isProduction = ENV_CONFIG.NODE_ENV === 'production';
        res.clearCookie('rio_token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
        });

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    };

    /**
     * Extract token from cookie or Authorization header
     */
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

    private renderPage(fileName: string, replacements: Record<string, string>): string {
        let html = readFileSync(join(PAGES_DIR, fileName), 'utf-8');
        for (const [key, value] of Object.entries(replacements)) {
            html = html.split(`{{${key}}}`).join(value);
        }
        return html;
    }
}
