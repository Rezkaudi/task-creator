import { useEffect, useCallback, useRef } from 'react';

export function usePluginMessage(handlers) {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        function onMessage(event) {
            const msg = event.data.pluginMessage;
            if (!msg) return;

            const handler = handlersRef.current[msg.type];
            if (handler) {
                handler(msg);
            }
        }

        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const sendMessage = useCallback((type, data = {}) => {
        parent.postMessage({
            pluginMessage: { type, ...data }
        }, '*');
    }, []);

    return sendMessage;
}
