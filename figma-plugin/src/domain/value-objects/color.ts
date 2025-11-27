/**
 * Color value object representing RGB color values
 */
export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Color with alpha channel
 */
export interface ColorWithAlpha extends Color {
  readonly a?: number;
}

/**
 * Factory for creating normalized colors
 */
export const ColorFactory = {
  create(r: number, g: number, b: number): Color {
    return {
      r: ColorFactory.normalize(r),
      g: ColorFactory.normalize(g),
      b: ColorFactory.normalize(b),
    };
  },

  createWithAlpha(r: number, g: number, b: number, a?: number): ColorWithAlpha {
    return {
      ...ColorFactory.create(r, g, b),
      a: a !== undefined ? ColorFactory.normalize(a) : undefined,
    };
  },

  normalize(value: number): number {
    return Math.max(0, Math.min(1, value));
  },

  round(color: Color, precision: number = 3): Color {
    const factor = Math.pow(10, precision);
    return {
      r: Math.round(color.r * factor) / factor,
      g: Math.round(color.g * factor) / factor,
      b: Math.round(color.b * factor) / factor,
    };
  },
};
