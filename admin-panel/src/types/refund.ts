export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  _id: string;
  order: {
    _id: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  } | string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  reason: string;
  status: RefundStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
