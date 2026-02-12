// File: /backend/src/infrastructure/web/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { GoogleSignInUseCase } from '../../../application/use-cases/google-sign-in.use-case';
import { VerifySessionUseCase } from '../../../application/use-cases/verify-session.use-case';
import { ENV_CONFIG } from '../../config/env.config';

export class AuthController {
    constructor(
        private readonly googleSignInUseCase: GoogleSignInUseCase,
        private readonly verifySessionUseCase: VerifySessionUseCase,
    ) { }

    /**
     * GET /auth/google
     * Redirects to Google OAuth consent screen
     */
    googleAuth = async (_req: Request, res: Response): Promise<void> => {
        try {
            const authUrl = this.googleSignInUseCase.getAuthUrl();
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
            if (!code) {
                res.status(400).json({
                    success: false,
                    message: 'Authorization code is missing',
                });
                return;
            }

            const { user, token } = await this.googleSignInUseCase.execute(code);

            // Set HTTP-only cookie for web frontend
            const isProduction = ENV_CONFIG.NODE_ENV === 'production';
            res.cookie('rio_token', token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/',
            });

            // Serve HTML page with token for Figma plugin
            res.send(this.getCallbackHtml(token, user.userName || user.email || 'User'));
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.send(this.getErrorHtml((error as Error).message));
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

    /**
     * HTML page served after successful Google login
     */
    private getCallbackHtml(token: string, userName: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rio - Sign In Successful</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: rgba(255,255,255,0.06);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
        }
        .success-icon {
            width: 64px; height: 64px;
            background: linear-gradient(135deg, #4ade80, #22c55e);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
            font-size: 32px;
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: rgba(255,255,255,0.6); margin-bottom: 32px; font-size: 14px; }
        .token-section {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .token-label {
            font-size: 12px;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .token-value {
            font-family: 'Fira Code', monospace;
            font-size: 12px;
            color: #a78bfa;
            word-break: break-all;
            line-height: 1.6;
            max-height: 80px;
            overflow-y: auto;
            padding: 8px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
        }
        .copy-btn {
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            border: none;
            color: #fff;
            padding: 14px 32px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s;
        }
        .copy-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(124,58,237,0.4); }
        .copy-btn.copied { background: linear-gradient(135deg, #22c55e, #4ade80); }
        .instructions {
            margin-top: 24px;
            font-size: 13px;
            color: rgba(255,255,255,0.4);
            line-height: 1.6;
        }
        .instructions strong { color: rgba(255,255,255,0.7); }
    </style>
</head>
<body>
    <div class="card">
        <div class="success-icon">✓</div>
        <h1>Welcome, ${userName}!</h1>
        <p class="subtitle">You've successfully signed in with Google</p>
        
        <div class="token-section">
            <div class="token-label">Your Auth Token</div>
            <div class="token-value" id="token">${token}</div>
        </div>
        
        <button class="copy-btn" id="copyBtn" onclick="copyToken()">
            📋 Copy Token
        </button>
        
        <div class="instructions">
            <strong>Next step:</strong> Go back to the Rio Figma plugin and paste this token to complete sign-in.
        </div>
    </div>
    
    <script>
        function copyToken() {
            const token = document.getElementById('token').textContent;
            navigator.clipboard.writeText(token).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.textContent = '✅ Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '📋 Copy Token';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    </script>
</body>
</html>`;
    }

    /**
     * HTML page served on auth error
     */
    private getErrorHtml(errorMessage: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rio - Sign In Failed</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: rgba(255,255,255,0.06);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 48px;
            max-width: 480px;
            width: 90%;
            text-align: center;
        }
        .error-icon {
            width: 64px; height: 64px;
            background: linear-gradient(135deg, #ef4444, #f87171);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
            font-size: 32px;
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .error-msg { color: rgba(255,255,255,0.6); margin-bottom: 24px; font-size: 14px; }
        .retry-btn {
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            border: none;
            color: #fff;
            padding: 14px 32px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="error-icon">✕</div>
        <h1>Sign In Failed</h1>
        <p class="error-msg">${errorMessage}</p>
        <a href="/auth/google" class="retry-btn">Try Again</a>
    </div>
</body>
</html>`;
    }
}
