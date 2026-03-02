import { useCallback } from 'react';

export function useNotify() {
    return useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        parent.postMessage({
            pluginMessage: {
                type: 'SHOW_NOTIFICATION',
                message,
                isError: type === 'error',
            }
        }, '*');
    }, []);
}
