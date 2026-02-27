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
