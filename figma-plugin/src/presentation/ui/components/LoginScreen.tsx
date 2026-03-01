import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useApiClient } from '../hooks/useApiClient.ts';
import { API_BASE_URL, GOOGLE_ICON_SVG } from '../utils';
import '../styles/login.css';
import RioLogo from '../assets/rio--logo.png';


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
