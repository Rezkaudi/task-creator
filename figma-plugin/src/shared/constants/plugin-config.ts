declare const process: { env: { [key: string]: string } };
/**
 * Plugin configuration constants
 */
export const PluginConfig = {
  UI_WIDTH: 780,
  UI_HEIGHT: 900,
  THEME_COLORS: true,
} as const;

/**
 * API Configuration
 */
export const ApiConfig = {
  BASE_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  // For local development, use:

  //BASE_URL: 'http://localhost:5000',
} as const;

console.log('🔌 Current Backend URL:', ApiConfig.BASE_URL);

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

export const defaultModelId = 'devstral-latest'; // default model ID for the plugin 