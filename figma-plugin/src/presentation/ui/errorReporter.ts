import { API_BASE_URL } from './utils/formatters';

interface ErrorContext {
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
    componentName?: string;
    actionType?: string;
}

interface ErrorPayload {
    errorMessage: string;
    errorStack?: string;
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
    pluginVersion: string;
    platform: string;
    browserInfo: string;
    componentName: string;
    actionType?: string;
}

let headers: Record<string, string> = { 'Content-Type': 'application/json' };
let pendingErrors: ErrorPayload[] = [];
let isReporting = false;
const PLUGIN_VERSION = '2.0.0';

export function setHeaders(newHeaders: Record<string, string>): void {
    headers = { ...newHeaders };
}

export async function reportError(error: unknown, context: ErrorContext = {}): Promise<void> {
    const payload = buildPayload(error, context);
    pendingErrors.push(payload);
    await processQueue();
}

export function reportErrorAsync(error: unknown, context: ErrorContext = {}): void {
    const payload = buildPayload(error, context);
    pendingErrors.push(payload);
    processQueue().catch(console.error);
}

function buildPayload(error: unknown, context: ErrorContext): ErrorPayload {
    const isErrorObject = error instanceof Error;
    return {
        errorMessage: isErrorObject ? error.message : String(error),
        errorStack: isErrorObject ? error.stack : undefined,
        errorCode: context.errorCode,
        errorDetails: {
            ...context.errorDetails,
            errorName: isErrorObject ? error.name : 'Unknown',
            url: window.location?.href,
        },
        pluginVersion: PLUGIN_VERSION,
        platform: 'figma-plugin-ui',
        browserInfo: getBrowserInfo(),
        componentName: context.componentName || 'UI',
        actionType: context.actionType,
    };
}

function getBrowserInfo(): string {
    try {
        return navigator.userAgent;
    } catch {
        return 'unknown';
    }
}

async function processQueue(): Promise<void> {
    if (isReporting || pendingErrors.length === 0) {
        return;
    }

    isReporting = true;

    while (pendingErrors.length > 0) {
        const payload = pendingErrors.shift();
        if (payload) {
            try {
                await sendError(payload);
            } catch (sendErr) {
                console.error('Failed to send error report:', sendErr);
            }
        }
    }

    isReporting = false;
}

async function sendError(payload: ErrorPayload): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/errors`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!data.success) {
            console.warn('Error report submission failed:', data.message);
        }

        return data;
    } catch (error) {
        console.error('Network error while reporting error:', error);
        return { success: false, message: 'Network error' };
    }
}

export function wrapAsync<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context: ErrorContext
): (...args: T) => Promise<R> {
    return async function (this: unknown, ...args: T): Promise<R> {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            reportErrorAsync(error, context);
            throw error;
        }
    };
}

export function setupGlobalHandlers(): void {
    window.addEventListener('error', function (event: ErrorEvent) {
        reportErrorAsync(event.error || event.message, {
            componentName: 'GlobalErrorHandler',
            actionType: 'unhandled-error',
            errorDetails: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            }
        });
    });

    window.addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
        reportErrorAsync(event.reason || 'Unhandled Promise Rejection', {
            componentName: 'GlobalErrorHandler',
            actionType: 'unhandled-rejection',
        });
    });

    // Forward error reports from the plugin main thread.
    // The main thread cannot use fetch directly in Figma web due to cross-origin
    // frame restrictions, so it routes through the UI iframe instead.
    window.addEventListener('message', function (event: MessageEvent) {
        const msg = event.data?.pluginMessage;
        if (msg?.type === 'FORWARD_ERROR_REPORT' && msg.payload) {
            fetch(`${API_BASE_URL}/api/errors`, {
                method: 'POST',
                headers: msg.headers || { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg.payload),
            }).catch(() => { });
        }
    });
}
