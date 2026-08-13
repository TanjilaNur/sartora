export interface Category {
  _id: string;
  name: string;
}

export interface ProductVariant {
  _id: string;
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: Category | string;
  price: number;
  stock: number;
  images: string[];
  variants: ProductVariant[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export function categoryName(category: Category | string): string {
  return typeof category === 'string' ? category : category.name;
}

export function categoryId(category: Category | string): string {
  return typeof category === 'string' ? category : category._id;
}

export function productImage(product: Product): string {
  return product.images[0] ?? '';
}

/** Distinct sizes across all variants, in the order the admin entered them —
 * shown as an independently selectable row, Daraz/Lazada-style, rather than
 * one option per size+color combination. */
export function variantSizes(product: Product): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of product.variants) {
    if (v.size && !seen.has(v.size)) {
      seen.add(v.size);
      result.push(v.size);
    }
  }
  return result;
}

/** Distinct colors across all variants, in entry order — a separate
 * selectable row from variantSizes, same reasoning. */
export function variantColors(product: Product): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of product.variants) {
    if (v.color && !seen.has(v.color)) {
      seen.add(v.color);
      result.push(v.color);
    }
  }
  return result;
}

/** The concrete variant for a given size/color pick, if any — variants are a
 * sparse list (not every combination need exist), so this can legitimately
 * return undefined while the user is still mid-selection. */
export function findVariant(
  product: Product,
  pick: { size?: string; color?: string }
): ProductVariant | undefined {
  return product.variants.find((v) => {
    const sizeOk = pick.size === undefined || v.size === pick.size;
    const colorOk = pick.color === undefined || v.color === pick.color;
    return sizeOk && colorOk;
  });
}

/** Whether any in-stock variant matches the given (possibly partial)
 * size/color pick — used to grey out the OTHER axis's options that have no
 * stock in combination with what's already selected. */
export function hasStockFor(product: Product, pick: { size?: string; color?: string }): boolean {
  return product.variants.some((v) => {
    const sizeOk = pick.size === undefined || v.size === pick.size;
    const colorOk = pick.color === undefined || v.color === pick.color;
    return sizeOk && colorOk && v.stock > 0;
  });
}
