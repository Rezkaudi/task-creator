/**
 * Font name value object
 */
export interface FontName {
  readonly family: string;
  readonly style: string;
}

/**
 * Line height value object
 */
export interface LineHeight {
  readonly unit: 'PIXELS' | 'PERCENT' | 'AUTO';
  readonly value?: number;
}

/**
 * Letter spacing value object
 */
export interface LetterSpacing {
  readonly unit: 'PIXELS' | 'PERCENT';
  readonly value: number;
}

/**
 * Default fonts
 */
export const DefaultFonts = {
  INTER: { family: 'Inter', style: 'Regular' } as FontName,
  ARIAL: { family: 'Arial', style: 'Regular' } as FontName,
  ROBOTO: { family: 'Roboto', style: 'Regular' } as FontName,
} as const;

/**
 * Check if two fonts are equal
 */
export function fontsEqual(a: FontName, b: FontName): boolean {
  return a.family === b.family && a.style === b.style;
}
