export interface Category {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id?: string;
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

export interface ProductPayload {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  images?: string[];
  variants?: ProductVariant[];
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}
