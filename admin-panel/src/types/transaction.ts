export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Transaction {
  _id: string;
  order: {
    _id: string;
    total: number;
    status: string;
    paymentStatus: string;
    address?: { city: string; country: string };
  } | string | null;
  user: { _id: string; name: string; email: string } | string | null;
  stripePaymentIntentId: string;
  amount: number; // in cents
  currency: string;
  status: TransactionStatus;
  stripeRefundId?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}
