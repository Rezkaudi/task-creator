import React from 'react';
import { AppProvider } from './context/AppContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import LoginScreen from './screens/LoginScreen.tsx';
import HomeScreen from './screens/HomeScreen.tsx';
import ResizeHandle from './components/shared/ResizeHandle.tsx';

function AppRouter(): React.JSX.Element {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen />
    }

    return <HomeScreen />;
}

export default function App(): React.JSX.Element {
    return (
        <AuthProvider>
            <AppProvider>
                <AppRouter />
                <ResizeHandle />
            </AppProvider>
        </AuthProvider>
    );
}
