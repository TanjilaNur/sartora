import { tryParseHexColor } from '../utils/color';

export interface CartItemVariant {
  id: string;
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
}

export interface CartItemProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export interface CartItem {
  product: CartItemProduct;
  variant?: CartItemVariant;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

/** Excludes a hex color from the text label — that's shown as a swatch dot
 * via swatchColor() instead of a raw "#ff0000" string. */
export function variantLabel(variant?: CartItemVariant): string {
  if (!variant) return '';
  const { size, color } = variant;
  const colorText = color && !tryParseHexColor(color) ? color : undefined;
  if (size && colorText) return `${size} / ${colorText}`;
  return size || colorText || '';
}

export function variantSwatch(variant?: CartItemVariant): string | null {
  return variant ? tryParseHexColor(variant.color) : null;
}
