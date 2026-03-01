// ── Timing Constants ─────────────────────────────────────────────────

export const POLLING_INTERVAL_MS = 2000;
export const PAYMENT_POLL_TIMEOUT_MS = 5 * 60 * 1000;
export const AUTH_TOKEN_TIMEOUT_MS = 3000;
export const HEADERS_TIMEOUT_MS = 5000;
export const SELECTION_INFO_DELAY_MS = 100;

// Preview image generation timeouts
export const PREVIEW_IMAGE_TIMEOUT_MS = 8000;
export const PREVIEW_FROM_DATA_TIMEOUT_MS = 15000;

// ── API Paths ────────────────────────────────────────────────────────

export const API_PATHS = {
    PROJECTS: '/api/ui-library/projects',
    COMPONENTS: '/api/ui-library/components',
    UPLOAD_IMAGE: '/api/ui-library/components/upload-image',
    AI_MODELS: '/api/ai-models',
    DESIGN_SYSTEMS: '/api/design-systems',
    SUBSCRIPTIONS_STATUS: '/api/subscriptions/status',
    BALANCE: '/api/payments/balance',
    PACKAGES: '/api/payments/packages',
    PLANS: '/api/subscriptions/plans',
    AUTH_ME: '/auth/me',
    ERRORS: '/api/errors',
} as const;

// ── Plugin Message Types ─────────────────────────────────────────────

export const MESSAGE_TYPES = {
    GET_AUTH_TOKEN: 'GET_AUTH_TOKEN',
    AUTH_TOKEN_RESPONSE: 'AUTH_TOKEN_RESPONSE',
    SAVE_AUTH_TOKEN: 'SAVE_AUTH_TOKEN',
    CLEAR_AUTH_TOKEN: 'CLEAR_AUTH_TOKEN',
    GET_HEADERS: 'GET_HEADERS',
    HEADERS_RESPONSE: 'HEADERS_RESPONSE',
} as const;

// ── Fallback Assets ──────────────────────────────────────────────────

export const FALLBACK_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
  <rect width="320" height="180" fill="#f3f4f6" />
  <text x="160" y="90" dominant-baseline="middle" text-anchor="middle" font-size="16" fill="#6b7280" font-family="Arial">No Preview</text>
</svg>`;

export const GOOGLE_ICON_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;
