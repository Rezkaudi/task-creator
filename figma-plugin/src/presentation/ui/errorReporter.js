import { API_BASE_URL } from './utils.js';

let headers = { 'Content-Type': 'application/json' };
let pendingErrors = [];
let isReporting = false;
const PLUGIN_VERSION = '2.0.0';

export function setHeaders(newHeaders) {
    headers = { ...newHeaders };
}

export async function reportError(error, context = {}) {
    const payload = buildPayload(error, context);
    pendingErrors.push(payload);
    await processQueue();
}

export function reportErrorAsync(error, context = {}) {
    const payload = buildPayload(error, context);
    pendingErrors.push(payload);
    processQueue().catch(console.error);
}

function buildPayload(error, context) {
    const isErrorObject = error instanceof Error;
    console.log('Reporting error:', error, 'Context:', context);
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

function getBrowserInfo() {
    try {
        return navigator.userAgent;
    } catch {
        return 'unknown';
    }
}

async function processQueue() {
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

async function sendError(payload) {
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

export function wrapAsync(fn, context) {
    return async function (...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            reportErrorAsync(error, context);
            throw error;
        }
    };
}

export function setupGlobalHandlers() {
    window.addEventListener('error', function (event) {
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

    window.addEventListener('unhandledrejection', function (event) {
        reportErrorAsync(event.reason || 'Unhandled Promise Rejection', {
            componentName: 'GlobalErrorHandler',
            actionType: 'unhandled-rejection',
        });
    });
}
