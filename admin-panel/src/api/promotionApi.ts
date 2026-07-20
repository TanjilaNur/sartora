import axios from 'axios';
import type { Promotion, CreatePromotionPayload, UpdatePromotionPayload } from '../types/promotion';

const BASE = 'http://localhost:4000/api/promotions';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPromotions(token: string): Promise<Promotion[]> {
  const { data } = await axios.get<{ promotions: Promotion[] }>(BASE, {
    headers: authHeader(token),
  });
  return data.promotions;
}

export async function createPromotion(token: string, payload: CreatePromotionPayload): Promise<Promotion> {
  const { data } = await axios.post<{ promotion: Promotion }>(BASE, payload, {
    headers: authHeader(token),
  });
  return data.promotion;
}

export async function updatePromotion(token: string, id: string, payload: UpdatePromotionPayload): Promise<Promotion> {
  const { data } = await axios.put<{ promotion: Promotion }>(`${BASE}/${id}`, payload, {
    headers: authHeader(token),
  });
  return data.promotion;
}

export async function deletePromotion(token: string, id: string): Promise<void> {
  await axios.delete(`${BASE}/${id}`, { headers: authHeader(token) });
}
