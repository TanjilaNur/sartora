export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderItem {
  product: string;
  variant?: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
  address: OrderAddress;
  paymentDetails: {
    method: string;
    transactionId?: string;
    stripePaymentIntentId?: string;
  };
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponse {
  orderId: string;
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
  items: OrderItem[];
  status: OrderStatus;
}

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
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
  };
  shippingAddress: OrderAddress;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
}
