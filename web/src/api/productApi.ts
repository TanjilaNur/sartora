import axios from 'axios';
import { API } from './client';
import type { ProductsResponse, Product, CategoriesResponse } from '../types/product';

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const { data } = await axios.get<ProductsResponse>(`${API}/products`, { params });
  return data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await axios.get<{ product: Product }>(`${API}/products/${id}`);
  return data.product;
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const { data } = await axios.get<CategoriesResponse>(`${API}/categories`);
  return data;
}
