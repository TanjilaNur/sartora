export interface Refund {
  _id: string;
  order: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}
