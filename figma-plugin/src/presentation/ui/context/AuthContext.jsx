import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../utils.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

    const fetchSubscriptionStatus = useCallback(async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/subscriptions/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.success ? data.subscription : null;
        } catch (_error) {
            return null;
        }
    }, []);

    const fetchBalance = useCallback(async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/balance`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return { pointsBalance: 0, hasPurchased: false };
            }

            const data = await response.json();
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
    }, []);

    const verifyToken = useCallback(async (token) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const [balance, subscription] = await Promise.all([
                        fetchBalance(token),
                        fetchSubscriptionStatus(token)
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
    }, [fetchBalance]);

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

        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Invalid token. Please try signing in again.');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Authentication failed');
            }

            const [balance, subscription] = await Promise.all([
                fetchBalance(token),
                fetchSubscriptionStatus(token)
            ]);

            // Store token in plugin storage
            parent.postMessage({
                pluginMessage: { type: 'SAVE_AUTH_TOKEN', token: token }
            }, '*');

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
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Login failed',
            }));
        }
    }, [fetchBalance]);

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
