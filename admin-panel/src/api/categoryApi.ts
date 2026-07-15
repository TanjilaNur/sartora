import axios from 'axios';
import type { Category } from '../types/product';

const BASE = 'http://localhost:4000/api/categories';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await axios.get<{ categories: Category[] }>(BASE);
  return data.categories;
}

export async function createCategory(token: string, name: string): Promise<Category> {
  const { data } = await axios.post<{ category: Category }>(BASE, { name }, {
    headers: authHeader(token),
  });
  return data.category;
}

export async function updateCategory(token: string, id: string, name: string): Promise<Category> {
  const { data } = await axios.put<{ category: Category }>(`${BASE}/${id}`, { name }, {
    headers: authHeader(token),
  });
  return data.category;
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`, { headers: authHeader(token) });
}
