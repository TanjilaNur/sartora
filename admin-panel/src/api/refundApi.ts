import axios from 'axios';
import type { RefundRequest } from '../types/refund';

const BASE = 'http://localhost:4000/api/refunds';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAllRefunds(token: string): Promise<RefundRequest[]> {
  const { data } = await axios.get<{ refunds: RefundRequest[] }>(BASE, {
    headers: authHeader(token),
  });
  return data.refunds;
}

export async function approveRefund(token: string, refundId: string): Promise<RefundRequest> {
  const { data } = await axios.put<{ refund: RefundRequest }>(
    `${BASE}/${refundId}/approve`,
    {},
    { headers: authHeader(token) }
  );
  return data.refund;
}

export async function rejectRefund(
  token: string,
  refundId: string,
  adminNote?: string
): Promise<RefundRequest> {
  const { data } = await axios.put<{ refund: RefundRequest }>(
    `${BASE}/${refundId}/reject`,
    { adminNote },
    { headers: authHeader(token) }
  );
  return data.refund;
}
