import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useApiClient } from '../hooks/useApiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { apiGet } = useApiClient();
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        token: null,
        pointsBalance: 0,
        hasPurchased: false,
        subscription: null,
        error: null,
    });

    const fetchSubscriptionStatus = useCallback(async () => {
        try {
            const data = await apiGet('/api/subscriptions/status');
            return data.success ? data.subscription : null;
        } catch (_error) {
            return null;
        }
    }, [apiGet]);

    const fetchBalance = useCallback(async () => {
        try {
            const data = await apiGet('/api/payments/balance');
            if (!data.success) {
                return { pointsBalance: 0, hasPurchased: false };
            }

            return {
                pointsBalance: Number(data.pointsBalance || 0),
                hasPurchased: Boolean(data.hasPurchased),
            };
        } catch (_error) {
            return { pointsBalance: 0, hasPurchased: false };
        }
    }, [apiGet]);

    const verifyToken = useCallback(async (token) => {
        try {
            const data = await apiGet('/auth/me');

            if (data.success) {
                const [balance, subscription] = await Promise.all([
                    fetchBalance(),
                    fetchSubscriptionStatus()
                ]);
                setAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: data.user,
                    token: token,
                    pointsBalance: balance.pointsBalance,
                    hasPurchased: balance.hasPurchased,
                    subscription: subscription,
                    error: null,
                });
                return;
            }

            // Token invalid - clear it
            parent.postMessage({
                pluginMessage: { type: 'CLEAR_AUTH_TOKEN' }
            }, '*');

            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                token: null,
                pointsBalance: 0,
                hasPurchased: false,
                error: null,
            });
        } catch (error) {
            console.warn('Token verification failed:', error);
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                token: null,
                pointsBalance: 0,
                hasPurchased: false,
                error: null,
            });
        }
    }, [apiGet, fetchBalance, fetchSubscriptionStatus]);

    // Load stored token on mount
    useEffect(() => {
        const loadToken = () => {
            // Ask the plugin main thread for the stored token
            parent.postMessage({
                pluginMessage: { type: 'GET_AUTH_TOKEN' }
            }, '*');

            const handler = (event) => {
                if (event.data.pluginMessage?.type === 'AUTH_TOKEN_RESPONSE') {
                    window.removeEventListener('message', handler);
                    const storedToken = event.data.pluginMessage.token;

                    if (storedToken) {
                        // Verify token with backend
                        verifyToken(storedToken);
                    } else {
                        setAuthState(prev => ({
                            ...prev,
                            isLoading: false,
                        }));
                    }
                }
            };

            window.addEventListener('message', handler);

            // Timeout - if no response in 3s, assume no token
            setTimeout(() => {
                window.removeEventListener('message', handler);
                setAuthState(prev => {
                    if (prev.isLoading && !prev.isAuthenticated) {
                        return { ...prev, isLoading: false };
                    }
                    return prev;
                });
            }, 3000);
        };

        loadToken();
    }, [verifyToken]);

    const login = useCallback(async (token) => {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        // Save token first so apiGet's getHeaders() can retrieve it
        parent.postMessage({
            pluginMessage: { type: 'SAVE_AUTH_TOKEN', token: token }
        }, '*');

        try {
            const data = await apiGet('/auth/me');
            if (!data.success) {
                throw new Error(data.message || 'Authentication failed');
            }

            const [balance, subscription] = await Promise.all([
                fetchBalance(),
                fetchSubscriptionStatus()
            ]);

            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: data.user,
                token: token,
                pointsBalance: balance.pointsBalance,
                hasPurchased: balance.hasPurchased,
                subscription: subscription,
                error: null,
            });
        } catch (error) {
            // Clear token on failure
            parent.postMessage({
                pluginMessage: { type: 'CLEAR_AUTH_TOKEN' }
            }, '*');

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Login failed',
            }));
        }
    }, [apiGet, fetchBalance, fetchSubscriptionStatus]);

    const logout = useCallback(() => {
        // Clear stored token
        parent.postMessage({
            pluginMessage: { type: 'CLEAR_AUTH_TOKEN' }
        }, '*');

        setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            token: null,
            pointsBalance: 0,
            hasPurchased: false,
            error: null,
        });
    }, []);

    const clearError = useCallback(() => {
        setAuthState(prev => ({ ...prev, error: null }));
    }, []);

    const updateSubscription = useCallback((subscriptionUpdate) => {
        console.log('[AuthContext] updateSubscription called with:', subscriptionUpdate);
        setAuthState(prev => {
            const newSubscription = prev.subscription
                ? { ...prev.subscription, ...subscriptionUpdate }
                : subscriptionUpdate;
            console.log('[AuthContext] Previous subscription:', prev.subscription);
            console.log('[AuthContext] New subscription:', newSubscription);
            return {
                ...prev,
                subscription: newSubscription
            };
        });
    }, []);

    const updatePointsBalance = useCallback((pointsBalance, hasPurchased) => {
        console.log('[AuthContext] updatePointsBalance called with:', { pointsBalance, hasPurchased });
        setAuthState(prev => ({
            ...prev,
            pointsBalance: Number(pointsBalance || 0),
            hasPurchased: Boolean(hasPurchased)
        }));
    }, []);

    return (
        <AuthContext.Provider value={{
            ...authState,
            login,
            logout,
            clearError,
            updateSubscription,
            updatePointsBalance
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
