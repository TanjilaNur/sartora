export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
}

export interface RevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export interface OrderStatusCount {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  count: number;
}

export interface RecentOrder {
  _id: string;
  user: { _id: string; name: string; email: string } | string | null;
  items: { name: string; quantity: number }[];
  total: number;
  status: OrderStatusCount['status'];
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueTrend: RevenuePoint[];
  orderStatusBreakdown: OrderStatusCount[];
  recentOrders: RecentOrder[];
}
