import axios from 'axios';
import { API } from './client';
import type { Faq } from '../types/faq';

export async function fetchFaqs(category?: string): Promise<Faq[]> {
  const { data } = await axios.get<{ faqs: Faq[] }>(`${API}/faq`, {
    params: category ? { category } : undefined,
  });
  return data.faqs;
}

export async function fetchFaqCategories(): Promise<string[]> {
  const { data } = await axios.get<{ categories: string[] }>(`${API}/faq/categories`);
  return data.categories;
}
