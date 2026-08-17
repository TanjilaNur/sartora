export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  user: { _id: string; name: string; email: string } | string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
  address: Address;
  paymentDetails: {
    method: string;
    transactionId?: string;
  };
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}
