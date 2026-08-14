import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api/orderApi';
import type { Order } from '../types/order';
import { FullPageSpinner } from '../components/Spinner';
import { STATUS_COLORS, PAYMENT_COLORS } from '../utils/orderColors';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (error) return <p className="py-16 text-center text-danger">{error}</p>;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primaryTint text-4xl">🧾</span>
        <p className="text-lg font-semibold text-textPrimary">No orders yet</p>
        <p className="text-sm text-textSecondary">Your order history will show up here.</p>
        <Link to="/" className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-bold text-textPrimary">My Orders</h1>
      {orders.map((order) => (
        <Link
          key={order._id}
          to={`/orders/${order._id}`}
          className="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-card transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-mono text-sm font-semibold text-textPrimary">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-textSecondary">
              {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${PAYMENT_COLORS[order.paymentStatus]}`}>
              {order.paymentStatus.toUpperCase()}
            </span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
              {order.status.toUpperCase()}
            </span>
            <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
