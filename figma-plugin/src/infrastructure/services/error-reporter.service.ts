// File: figma-plugin/src/infrastructure/services/error-reporter.service.ts

import { ApiConfig } from '../../shared/constants';

export interface ErrorReportPayload {
    errorCode?: string;
    errorMessage: string;
    errorStack?: string;
    errorDetails?: Record<string, any>;
    pluginVersion?: string;
    figmaVersion?: string;
    platform?: string;
    browserInfo?: string;
    componentName?: string;
    actionType?: string;
}

export interface ErrorReportResponse {
    success: boolean;
    error?: any;
    message?: string;
}

/**
 * Service for reporting client errors to the backend
 */
export class ErrorReporterService {
    private static instance: ErrorReporterService;
    private pendingErrors: ErrorReportPayload[] = [];
    private isReporting: boolean = false;
    private headers: HeadersInit = { 'Content-Type': 'application/json' };

    private constructor() { }

    static getInstance(): ErrorReporterService {
        if (!ErrorReporterService.instance) {
            ErrorReporterService.instance = new ErrorReporterService();
        }
        return ErrorReporterService.instance;
    }

    /**
     * Set headers (including user info) for API calls
     */
    setHeaders(headers: HeadersInit): void {
        this.headers = { ...headers };
    }

    /**
     * Report an error to the backend
     */
    async reportError(error: Error | string, context?: Partial<ErrorReportPayload>): Promise<void> {
        const payload = this.buildPayload(error, context);

        // Add to queue
        this.pendingErrors.push(payload);

        // Process queue
        await this.processQueue();
    }

    /**
     * Report an error synchronously (fire and forget)
     */
    reportErrorAsync(error: Error | string, context?: Partial<ErrorReportPayload>): void {
        const payload = this.buildPayload(error, context);
        this.pendingErrors.push(payload);
        this.processQueue().catch(console.error);
    }

    /**
     * Build error payload from error object or string
     */
    private buildPayload(error: Error | string, context?: Partial<ErrorReportPayload>): ErrorReportPayload {
        const isErrorObject = error instanceof Error;
        return {
            errorMessage: isErrorObject ? error.message : String(error),
            errorStack: isErrorObject ? error.stack : undefined,
            errorCode: context?.errorCode,
            errorDetails: {
                ...context?.errorDetails,
                errorName: isErrorObject ? error.name : 'Unknown',
            },
            pluginVersion: context?.pluginVersion || '2.0.0',
            figmaVersion: context?.figmaVersion,
            platform: context?.platform || this.detectPlatform(),
            browserInfo: context?.browserInfo,
            componentName: context?.componentName,
            actionType: context?.actionType,
        };
    }

    /**
     * Detect platform information
     */
    private detectPlatform(): string {
        try {
            // In Figma plugin context, we have limited access
            return 'figma-plugin';
        } catch {
            return 'unknown';
        }
    }

    /**
     * Process the error queue
     */
    private async processQueue(): Promise<void> {
        if (this.isReporting || this.pendingErrors.length === 0) {
            return;
        }

        this.isReporting = true;

        while (this.pendingErrors.length > 0) {
            const payload = this.pendingErrors.shift();
            if (payload) {
                try {
                    await this.sendError(payload);
                } catch (sendError) {
                    // Log locally but don't re-queue to avoid infinite loops
                    console.error('Failed to send error report:', sendError);
                }
            }
        }

        this.isReporting = false;
    }

    /**
     * Send error to backend API.
     * Routes through the UI iframe via postMessage to avoid cross-origin fetch
     * restrictions in Figma web (browser), where fetch from the plugin sandbox
     * tries to use cross-frame DOM access which the browser's SOP blocks.
     */
    private async sendError(payload: ErrorReportPayload): Promise<ErrorReportResponse> {
        try {
            figma.ui.postMessage({
                type: 'FORWARD_ERROR_REPORT',
                payload,
                headers: this.headers,
            });
            return { success: true };
        } catch (error) {
            console.error('Failed to forward error report to UI:', error);
            return {
                success: false,
                message: 'Failed to forward error report',
            };
        }
    }

    /**
     * Create a wrapped function that reports errors automatically
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(
        fn: T,
        context: Partial<ErrorReportPayload>
    ): T {
        return (async (...args: Parameters<T>) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.reportErrorAsync(error as Error, context);
                throw error;
            }
        }) as T;
    }

    /**
     * Create an error boundary for synchronous code
     */
    wrapSync<T extends (...args: any[]) => any>(
        fn: T,
        context: Partial<ErrorReportPayload>
    ): T {
        return ((...args: Parameters<T>) => {
            try {
                return fn(...args);
            } catch (error) {
                this.reportErrorAsync(error as Error, context);
                throw error;
            }
        }) as T;
    }
}

// Export singleton instance
export const errorReporter = ErrorReporterService.getInstance();