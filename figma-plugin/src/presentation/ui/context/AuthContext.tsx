import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useApiClient } from '../hooks/useApiClient.ts';
import type { AuthState, User, Subscription } from '../types';
import { AUTH_TOKEN_TIMEOUT_MS } from '../utils/constants';

interface AuthContextValue extends AuthState {
    login: (token: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    updateSubscription: (update: Partial<Subscription>) => void;
    updatePointsBalance: (balance: number, hasPurchased: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_AUTH: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    token: null,
    pointsBalance: 0,
    hasPurchased: false,
    subscription: null,
    error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { apiGet } = useApiClient();
    const [authState, setAuthState] = useState<AuthState>({
        ...EMPTY_AUTH,
        isLoading: true,
    });

    const fetchSubscriptionStatus = useCallback(async (): Promise<Subscription | null> => {
        try {
            const data = await apiGet('/api/subscriptions/status');
            return data.success ? data.subscription : null;
        } catch {
            return null;
        }
    }, [apiGet]);

    const fetchBalance = useCallback(async (): Promise<{ pointsBalance: number; hasPurchased: boolean }> => {
        try {
            const data = await apiGet('/api/payments/balance');
            if (!data.success) return { pointsBalance: 0, hasPurchased: false };
            return {
                pointsBalance: Number(data.pointsBalance || 0),
                hasPurchased: Boolean(data.hasPurchased),
            };
        } catch {
            return { pointsBalance: 0, hasPurchased: false };
        }
    }, [apiGet]);

    const verifyToken = useCallback(async (token: string) => {
        try {
            const data = await apiGet('/auth/me');

            if (data.success) {
                const [balance, subscription] = await Promise.all([
                    fetchBalance(),
                    fetchSubscriptionStatus(),
                ]);
                setAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: data.user as User,
                    token,
                    pointsBalance: balance.pointsBalance,
                    hasPurchased: balance.hasPurchased,
                    subscription,
                    error: null,
                });
                return;
            }

            parent.postMessage({ pluginMessage: { type: 'CLEAR_AUTH_TOKEN' } }, '*');
            setAuthState({ ...EMPTY_AUTH });
        } catch (error) {
            console.warn('Token verification failed:', error);
            setAuthState({ ...EMPTY_AUTH });
        }
    }, [apiGet, fetchBalance, fetchSubscriptionStatus]);

    useEffect(() => {
        const loadToken = () => {
            parent.postMessage({ pluginMessage: { type: 'GET_AUTH_TOKEN' } }, '*');

            const handler = (event: MessageEvent) => {
                if (event.data.pluginMessage?.type === 'AUTH_TOKEN_RESPONSE') {
                    window.removeEventListener('message', handler);
                    const storedToken = event.data.pluginMessage.token as string | null;
                    if (storedToken) {
                        verifyToken(storedToken);
                    } else {
                        setAuthState(prev => ({ ...prev, isLoading: false }));
                    }
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                window.removeEventListener('message', handler);
                setAuthState(prev => {
                    if (prev.isLoading && !prev.isAuthenticated) {
                        return { ...prev, isLoading: false };
                    }
                    return prev;
                });
            }, AUTH_TOKEN_TIMEOUT_MS);
        };

        loadToken();
    }, [verifyToken]);

    const login = useCallback(async (token: string) => {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        parent.postMessage({ pluginMessage: { type: 'SAVE_AUTH_TOKEN', token } }, '*');

        try {
            const data = await apiGet('/auth/me');
            if (!data.success) throw new Error(data.message || 'Authentication failed');

            const [balance, subscription] = await Promise.all([
                fetchBalance(),
                fetchSubscriptionStatus(),
            ]);

            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: data.user as User,
                token,
                pointsBalance: balance.pointsBalance,
                hasPurchased: balance.hasPurchased,
                subscription,
                error: null,
            });
        } catch (error) {
            parent.postMessage({ pluginMessage: { type: 'CLEAR_AUTH_TOKEN' } }, '*');
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: (error as Error).message || 'Login failed',
            }));
        }
    }, [apiGet, fetchBalance, fetchSubscriptionStatus]);

    const logout = useCallback(() => {
        parent.postMessage({ pluginMessage: { type: 'CLEAR_AUTH_TOKEN' } }, '*');
        setAuthState({ ...EMPTY_AUTH });
    }, []);

    const clearError = useCallback(() => {
        setAuthState(prev => ({ ...prev, error: null }));
    }, []);

    const updateSubscription = useCallback((subscriptionUpdate: Partial<Subscription>) => {
        setAuthState(prev => ({
            ...prev,
            subscription: prev.subscription
                ? { ...prev.subscription, ...subscriptionUpdate }
                : subscriptionUpdate as Subscription,
        }));
    }, []);

    const updatePointsBalance = useCallback((pointsBalance: number, hasPurchased: boolean) => {
        setAuthState(prev => ({
            ...prev,
            pointsBalance: Number(pointsBalance || 0),
            hasPurchased: Boolean(hasPurchased),
        }));
    }, []);

    return (
        <AuthContext.Provider value={{
            ...authState,
            login,
            logout,
            clearError,
            updateSubscription,
            updatePointsBalance,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
