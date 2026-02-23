import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useApiClient } from '../hooks/useApiClient.ts';
import { API_BASE_URL } from '../utils/formatters';
import '../styles/login.css';
import RioLogo from '../assets/rio--logo.png';

const GOOGLE_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

export default function LoginScreen(): React.JSX.Element {
    const { login, isLoading, error, clearError } = useAuth();
    const { apiFetch } = useApiClient();
    const [isPolling, setIsPolling] = useState(false);

    const handleGoogleSignIn = useCallback(async () => {
        // Request Figma headers from main thread
        parent.postMessage({ pluginMessage: { type: 'GET_HEADERS' } }, '*');

        const headers = await new Promise<Record<string, string>>((resolve) => {
            const handler = (event: MessageEvent) => {
                if (event.data.pluginMessage?.type === 'HEADERS_RESPONSE') {
                    window.removeEventListener('message', handler);
                    resolve(event.data.pluginMessage.headers);
                }
            };
            window.addEventListener('message', handler);
        });

        const figmaUserId = headers['x-figma-user-id'];

        // Generate a random polling ID
        const pollingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Encode state as pollingId:figmaUserId
        const state = figmaUserId ? `${pollingId}:${figmaUserId}` : pollingId;

        const authUrl = `${API_BASE_URL}/auth/google?state=${state}`;
        window.open(authUrl, '_blank');

        setIsPolling(true);
        clearError();

        // Start polling
        const pollInterval = setInterval(async () => {
            try {
                const data = await apiFetch(`${API_BASE_URL}/auth/poll?id=${pollingId}`);
                if (data.success && data.token) {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    login(data.token as string);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 2000);

        // Stop polling after 5 minutes (timeout)
        setTimeout(() => {
            clearInterval(pollInterval);
            if (isPolling) {
                setIsPolling(false);
            }
        }, 5 * 60 * 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(pollInterval);
    }, [login, clearError, isPolling, apiFetch]);

    return (
        <div className="login-screen">
            <div className="login-logo">
                <img src={RioLogo} alt="Rio Logo" className="logo-image" />
            </div>
            <p className="login-subtitle">
                Sign in to start creating stunning<br />designs with AI
            </p>

            <button
                className="google-sign-in-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isPolling}
            >
                <span
                    className="google-icon"
                    dangerouslySetInnerHTML={{ __html: GOOGLE_ICON_SVG }}
                />
                {isPolling ? 'Waiting for browser login...' : 'Sign in with Google'}
            </button>

            {isPolling && (
                <div className="login-divider">
                    <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: '#7c3aed' }}></div>
                </div>
            )}

            {error && (
                <div className="login-error">
                    ❌ {error}
                </div>
            )}

            {isLoading && !isPolling && (
                <div className="login-loading">
                    <div className="loading-spinner"></div>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>Verifying...</span>
                </div>
            )}
        </div>
    );
}
