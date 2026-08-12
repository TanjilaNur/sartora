import type { Order } from './order';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
}

export interface CustomerBadge {
  badge: {
    _id: string;
    name: string;
    description: string;
    icon: string;
  };
  earnedAt: string;
}

export interface CustomerProfile {
  user: Omit<Customer, 'orderCount' | 'totalSpent'>;
  stats: {
    totalOrders: number;
    totalSpent: number;
    pointsBalance: number;
    badgeCount: number;
    reviewCount: number;
  };
  orders: Order[];
  badges: CustomerBadge[];
}
