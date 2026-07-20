export interface Promotion {
  _id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  perUserLimit: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionPayload {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  perUserLimit?: number;
  expiresAt?: string;
}

export interface UpdatePromotionPayload {
  active?: boolean;
  maxUses?: number;
  perUserLimit?: number;
  expiresAt?: string;
  minOrderAmount?: number;
  value?: number;
  type?: 'percent' | 'fixed';
}
