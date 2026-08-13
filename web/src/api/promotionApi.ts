import axios from 'axios';
import { API, authHeader } from './client';
import type { PromoValidation } from '../types/promotion';

export async function validatePromo(code: string, orderTotal: number): Promise<PromoValidation> {
  const { data } = await axios.post<PromoValidation>(
    `${API}/promotions/validate`,
    { code: code.trim().toUpperCase(), orderTotal },
    { headers: authHeader() }
  );
  return data;
}
