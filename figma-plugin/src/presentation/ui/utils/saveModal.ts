export function getComponentNameFromExportData(exportData: unknown): string {
    if (Array.isArray(exportData) && exportData.length > 0) {
        return (exportData[0] as Record<string, unknown>)?.name as string || 'Untitled Component';
    }

    if (exportData && typeof exportData === 'object' && (exportData as Record<string, unknown>).name) {
        return (exportData as Record<string, unknown>).name as string;
    }

    return 'Untitled Component';
}

export interface PreviewImageOptions {
    maxWidth?: number;
    timeoutMs?: number;
    designData?: unknown;
}

export function requestPreviewImage({ maxWidth = 320, timeoutMs, designData }: PreviewImageOptions = {}): Promise<string | null> {
    const fromData = designData !== undefined;
    const timeout = timeoutMs ?? (fromData ? 15000 : 8000);

    return new Promise((resolve, reject) => {
        const requestId = `preview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        function cleanup() {
            window.removeEventListener('message', onMessage);
            if (timeoutId) clearTimeout(timeoutId);
        }

        function onMessage(event: MessageEvent) {
            const message = event.data?.pluginMessage;
            if (!message || message.requestId !== requestId) return;

            if (message.type === 'preview-image-generated') {
                cleanup();
                resolve(message.previewImage || null);
                return;
            }

            if (message.type === 'preview-image-error') {
                cleanup();
                reject(new Error(message.error || 'Failed to generate preview image'));
            }
        }

        timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Preview image generation timed out'));
        }, timeout);

        window.addEventListener('message', onMessage);
        parent.postMessage({
            pluginMessage: {
                type: fromData ? 'generate-preview-from-design-data' : 'generate-preview-image',
                requestId,
                maxWidth,
                ...(fromData && { designData }),
            },
        }, '*');
    });
}
