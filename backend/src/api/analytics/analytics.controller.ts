import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  getDashboardStats,
  getRevenueTrend,
  getOrderStatusBreakdown,
  getRecentOrders,
  DateRange,
} from './analytics.service';

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 7), 90);

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    let range: DateRange | undefined;
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        res.status(400).json({ message: 'startDate and endDate must both be provided' });
        return;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ message: 'startDate/endDate must be valid dates' });
        return;
      }
      if (start > end) {
        res.status(400).json({ message: 'startDate must not be after endDate' });
        return;
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      range = { start, end };
    }

    const [stats, revenueTrend, orderStatusBreakdown, recentOrders] = await Promise.all([
      getDashboardStats(range),
      getRevenueTrend(days, range),
      getOrderStatusBreakdown(range),
      getRecentOrders(6, range),
    ]);

    res.json({ stats, revenueTrend, orderStatusBreakdown, recentOrders });
  } catch (err) {
    next(err);
  }
}
