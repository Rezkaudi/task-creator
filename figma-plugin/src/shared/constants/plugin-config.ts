/**
 * Plugin configuration constants
 */
export const PluginConfig = {
  UI_WIDTH: 480,
  UI_HEIGHT: 680,
  THEME_COLORS: true,
} as const;

/**
 * API Configuration
 */
export const ApiConfig = {
  BASE_URL: 'https://task-creator-api.onrender.com',
  // For local development, use:
  // BASE_URL: 'http://localhost:5000',
} as const;

/**
 * Default values
 */
export const Defaults = {
  NODE_SIZE: 100,
  STROKE_WEIGHT: 1,
  OPACITY: 1,
  CORNER_RADIUS: 0,
  FONT_SIZE: 14,
  ITEM_SPACING: 0,
  PADDING: 0,
} as const;

/**
 * Page arrangement constants
 */
export const PageArrangement = {
  SPACING: 200,
} as const;
