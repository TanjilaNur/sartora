import { Order } from '../orders/order.model';
import { Product } from '../products/product.model';
import { User } from '../users/user.model';

const LOW_STOCK_THRESHOLD = 5;
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

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
  status: string;
  count: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export async function getDashboardStats(range?: DateRange): Promise<DashboardStats> {
  // Customers/products/low-stock are current-state snapshots (how many
  // exist right now) rather than time-series metrics — a date range
  // narrows revenue and order volume to that period, but doesn't change
  // what "how many customers do I have" means, so those three stay
  // unfiltered regardless of range.
  const orderDateMatch = range ? { createdAt: { $gte: range.start, $lte: range.end } } : {};

  const [revenueResult, totalOrders, totalCustomers, totalProducts, lowStockProducts] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid', ...orderDateMatch } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(orderDateMatch),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: LOW_STOCK_THRESHOLD } }),
  ]);

  return {
    totalRevenue: revenueResult[0]?.total ?? 0,
    totalOrders,
    totalCustomers,
    totalProducts,
    lowStockProducts,
  };
}

export async function getRevenueTrend(days: number, range?: DateRange): Promise<RevenuePoint[]> {
  let start: Date;
  let end: Date;
  if (range) {
    start = new Date(range.start);
    end = new Date(range.end);
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
    start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
  }

  const rows = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const byDate = new Map(rows.map((r) => [r._id as string, { revenue: r.revenue as number, orders: r.orders as number }]));

  // Zero-fill every day in the range so the trend line has no gaps, even
  // on days with no paid orders.
  const points: RevenuePoint[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    const found = byDate.get(key);
    points.push({ date: key, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export async function getOrderStatusBreakdown(range?: DateRange): Promise<OrderStatusCount[]> {
  const dateMatch = range ? [{ $match: { createdAt: { $gte: range.start, $lte: range.end } } }] : [];
  const rows = await Order.aggregate([...dateMatch, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = new Map(rows.map((r) => [r._id as string, r.count as number]));

  return ORDER_STATUSES.map((status) => ({ status, count: byStatus.get(status) ?? 0 }));
}

export async function getRecentOrders(limit: number, range?: DateRange) {
  const filter = range ? { createdAt: { $gte: range.start, $lte: range.end } } : {};
  return Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .select('user total status paymentStatus createdAt items')
    .lean();
}
