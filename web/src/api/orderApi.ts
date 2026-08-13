import axios from 'axios';
import { API, authHeader } from './client';
import type { CheckoutResponse, Order, Invoice } from '../types/order';

export async function checkout(input: {
  address: Record<string, string>;
  paymentMethod: string;
  promoCode?: string;
}): Promise<CheckoutResponse> {
  const { data } = await axios.post<CheckoutResponse>(
    `${API}/orders`,
    {
      address: input.address,
      paymentDetails: { method: input.paymentMethod },
      ...(input.promoCode ? { promoCode: input.promoCode } : {}),
    },
    { headers: authHeader() }
  );
  return data;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await axios.get<{ orders: Order[] }>(`${API}/orders`, { headers: authHeader() });
  return data.orders;
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const { data } = await axios.get<{ order: Order }>(`${API}/orders/${orderId}`, { headers: authHeader() });
  return data.order;
}

export async function cancelOrder(orderId: string): Promise<void> {
  await axios.post(`${API}/orders/${orderId}/cancel`, {}, { headers: authHeader() });
}

export async function fetchInvoice(orderId: string): Promise<Invoice> {
  const { data } = await axios.get<{ invoice: Invoice }>(`${API}/orders/${orderId}/invoice`, {
    headers: authHeader(),
  });
  return data.invoice;
}
