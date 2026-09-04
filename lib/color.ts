/**
 * Relative luminance of a #rrggbb (or rrggbb) color.
 * 0 = black, 1 = white. WCAG-style sRGB coefficients.
 */
export function hexLuminance(hex: string): number {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (raw.length < 6) return 0;
  const chan = (i: number) => parseInt(raw.slice(i, i + 2), 16) / 255;
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

export function isLightHex(hex: string, threshold = 0.6): boolean {
  return hexLuminance(hex) > threshold;
}
