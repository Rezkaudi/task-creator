import { useEffect, useCallback, useRef } from 'react';
import type { PluginMessage, SendMessageFn } from '../types';

type MessageHandlers = Partial<Record<string, (msg: PluginMessage) => void>>;

export function usePluginMessage(handlers: MessageHandlers): SendMessageFn {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        function onMessage(event: MessageEvent) {
            const msg = event.data.pluginMessage as PluginMessage | undefined;
            if (!msg) return;
            const handler = handlersRef.current[msg.type];
            if (handler) handler(msg);
        }

        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const sendMessage = useCallback((type: string, data: Record<string, unknown> = {}) => {
        parent.postMessage({ pluginMessage: { type, ...data } }, '*');
    }, []);

    return sendMessage;
}
