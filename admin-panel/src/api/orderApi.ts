import axios from 'axios';
import type { Order, OrdersResponse, OrderStatus } from '../types/order';

export interface InvoiceLineItem {
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Invoice {
  invoiceNumber: string;
  issuedAt: string;
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
  };
  customer: { id: string };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
}

const BASE = 'http://localhost:4000/api/orders';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAllOrders(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<OrdersResponse> {
  const { data } = await axios.get<OrdersResponse>(`${BASE}/admin/all`, {
    headers: authHeader(token),
    params,
  });
  return data;
}

export async function fetchOrderById(token: string, orderId: string): Promise<Order> {
  const { data } = await axios.get<{ order: Order }>(`${BASE}/${orderId}`, {
    headers: authHeader(token),
  });
  return data.order;
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
  tracking?: { trackingNumber?: string; carrier?: string }
): Promise<Order> {
  const { data } = await axios.put<{ order: Order }>(
    `${BASE}/${orderId}/status`,
    { status, ...tracking },
    { headers: authHeader(token) }
  );
  return data.order;
}

export async function fetchOrderInvoice(token: string, orderId: string): Promise<Invoice> {
  const { data } = await axios.get<{ invoice: Invoice }>(`${BASE}/${orderId}/invoice`, {
    headers: authHeader(token),
  });
  return data.invoice;
}
