import { useCallback, useRef } from 'react';
import { API_BASE_URL } from '../utils.js';

export function useApiClient() {
    const headersPromiseRef = useRef(null);

    const getHeaders = useCallback(() => {
        if (headersPromiseRef.current) return headersPromiseRef.current;

        headersPromiseRef.current = new Promise((resolve, reject) => {
            parent.postMessage({
                pluginMessage: { type: 'GET_HEADERS' }
            }, '*');

            const messageHandler = (event) => {
                if (event.data.pluginMessage?.type === 'HEADERS_RESPONSE') {
                    window.removeEventListener('message', messageHandler);
                    headersPromiseRef.current = null;
                    resolve(event.data.pluginMessage.headers);
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

    const apiGet = useCallback(async (path) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, { headers: hdrs });
        return response.json();
    }, [getHeaders]);

    const apiPost = useCallback(async (path, body) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify(body)
        });
        return response.json();
    }, [getHeaders]);

    const apiDelete = useCallback(async (path) => {
        const hdrs = await getHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'DELETE',
            headers: hdrs
        });
        return response.json();
    }, [getHeaders]);

    const apiFetch = useCallback(async (url) => {
        const hdrs = await getHeaders();
        const response = await fetch(url, { headers: hdrs });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return response.json();
    }, [getHeaders]);

    return { getHeaders, apiGet, apiPost, apiDelete, apiFetch };
}
