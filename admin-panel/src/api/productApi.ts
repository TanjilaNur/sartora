import axios from 'axios';
import type { Product, ProductsResponse, ProductPayload, ImportResult } from '../types/product';

const BASE = 'http://localhost:4000/api/products';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const { data } = await axios.get<ProductsResponse>(BASE, { params });
  return data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await axios.get<{ product: Product }>(`${BASE}/${id}`);
  return data.product;
}

export async function createProduct(token: string, payload: ProductPayload): Promise<Product> {
  const { data } = await axios.post<{ product: Product }>(BASE, payload, {
    headers: authHeader(token),
  });
  return data.product;
}

export async function updateProduct(
  token: string,
  id: string,
  payload: Partial<ProductPayload>
): Promise<Product> {
  const { data } = await axios.put<{ product: Product }>(`${BASE}/${id}`, payload, {
    headers: authHeader(token),
  });
  return data.product;
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`, { headers: authHeader(token) });
}

export async function exportProductsCsv(token: string): Promise<Blob> {
  const { data } = await axios.get(`${BASE}/export`, {
    headers: authHeader(token),
    responseType: 'blob',
  });
  return data;
}

export async function importProductsCsv(token: string, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axios.post<ImportResult>(`${BASE}/import`, formData, {
    headers: { ...authHeader(token), 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
