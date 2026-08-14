import type { OrderStatus, PaymentStatus } from '../types/order';

// Shared by OrdersPage and OrderDetailPage so both badge sets always agree —
// dark: variants are required here since these are plain Tailwind palette
// colors (blue/indigo/purple), not theme-aware design tokens.
export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  shipped: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

export const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};
