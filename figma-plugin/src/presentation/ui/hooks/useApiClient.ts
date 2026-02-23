import { useCallback, useRef } from 'react';
import { API_BASE_URL } from '../utils/formatters';

export function useApiClient() {
    const headersPromiseRef = useRef<Promise<Record<string, string>> | null>(null);

    const getHeaders = useCallback((): Promise<Record<string, string>> => {
        if (headersPromiseRef.current) return headersPromiseRef.current;

        headersPromiseRef.current = new Promise((resolve, reject) => {
            parent.postMessage({ pluginMessage: { type: 'GET_HEADERS' } }, '*');

            const messageHandler = (event: MessageEvent) => {
                if (event.data.pluginMessage?.type === 'HEADERS_RESPONSE') {
                    window.removeEventListener('message', messageHandler);
                    headersPromiseRef.current = null;
                    resolve(event.data.pluginMessage.headers as Record<string, string>);
                }
            };

            window.addEventListener('message', messageHandler);

            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                headersPromiseRef.current = null;
                reject(new Error('Timeout waiting for headers'));
            }, 5000);
        });

        return headersPromiseRef.current;
    }, []);

    const apiGet = useCallback(async (path: string) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, { headers: hdrs });
        return response.json();
    }, [getHeaders]);

    const apiPost = useCallback(async (path: string, body: unknown) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify(body),
        });
        return response.json();
    }, [getHeaders]);

    const apiDelete = useCallback(async (path: string) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'DELETE',
            headers: hdrs,
        });
        return response.json();
    }, [getHeaders]);

    const apiFetch = useCallback(async (url: string) => {
        const hdrs = await getHeaders();
        const response = await fetch(url, { headers: hdrs });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
    }, [getHeaders]);

    return { getHeaders, apiGet, apiPost, apiDelete, apiFetch };
}
