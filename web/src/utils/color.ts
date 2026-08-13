const HEX_PATTERN = /^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/**
 * Returns a valid CSS hex color (e.g. "#ff0000") if `value` is a real hex
 * color set via the admin's color picker, or null if it's a legacy plain
 * name (e.g. "Black") from before that field was a picker. Callers fall
 * back to showing the name as text in that case instead of a swatch dot.
 */
export function tryParseHexColor(value?: string): string | null {
  if (!value) return null;
  const cleaned = value.trim().replace(/^#/, '');
  return HEX_PATTERN.test(cleaned) ? `#${cleaned}` : null;
}
