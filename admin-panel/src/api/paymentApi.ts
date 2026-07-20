import axios from 'axios';
import type { TransactionsResponse } from '../types/transaction';

const BASE = 'http://localhost:4000/api/payments';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAllTransactions(
  token: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<TransactionsResponse> {
  const { data } = await axios.get<TransactionsResponse>(`${BASE}/admin/all`, {
    headers: authHeader(token),
    params,
  });
  return data;
}

export async function refundTransaction(token: string, orderId: string): Promise<{ refundId: string; status: string }> {
  const { data } = await axios.post<{ refundId: string; status: string }>(
    `${BASE}/refund/${orderId}`,
    {},
    { headers: authHeader(token) }
  );
  return data;
}
