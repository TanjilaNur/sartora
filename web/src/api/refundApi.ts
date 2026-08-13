import axios from 'axios';
import { API, authHeader } from './client';
import type { Refund } from '../types/refund';

export async function requestRefund(orderId: string, reason: string): Promise<Refund> {
  const { data } = await axios.post<{ refund: Refund }>(
    `${API}/refunds/${orderId}`,
    { reason },
    { headers: authHeader() }
  );
  return data.refund;
}

export async function fetchMyRefund(orderId: string): Promise<Refund | null> {
  try {
    const { data } = await axios.get<{ refund: Refund }>(`${API}/refunds/my/${orderId}`, {
      headers: authHeader(),
    });
    return data.refund;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}
