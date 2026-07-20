import axios from 'axios';
import type { FAQ, CreateFAQPayload, UpdateFAQPayload } from '../types/faq';

const BASE = 'http://localhost:4000/api/faq';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAllFAQs(token: string, category?: string): Promise<FAQ[]> {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  const { data } = await axios.get<{ faqs: FAQ[] }>(`${BASE}/admin/all`, {
    headers: authHeader(token),
    params,
  });
  return data.faqs;
}

export async function createFAQ(token: string, payload: CreateFAQPayload): Promise<FAQ> {
  const { data } = await axios.post<{ faq: FAQ }>(BASE, payload, {
    headers: authHeader(token),
  });
  return data.faq;
}

export async function updateFAQ(token: string, faqId: string, payload: UpdateFAQPayload): Promise<FAQ> {
  const { data } = await axios.put<{ faq: FAQ }>(`${BASE}/${faqId}`, payload, {
    headers: authHeader(token),
  });
  return data.faq;
}

export async function deleteFAQ(token: string, faqId: string): Promise<void> {
  await axios.delete(`${BASE}/${faqId}`, { headers: authHeader(token) });
}

export async function fetchFAQCategories(): Promise<string[]> {
  const { data } = await axios.get<{ categories: string[] }>(`${BASE}/categories`);
  return data.categories;
}
