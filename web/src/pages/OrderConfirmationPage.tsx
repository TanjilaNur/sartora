import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrder } from '../api/orderApi';
import type { Order } from '../types/order';
import { FullPageSpinner } from '../components/Spinner';

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    // Always re-fetch the real, server-persisted order rather than trusting
    // any client-side checkout state — that's what makes this screen show
    // the actual charged amount/discount instead of stale or guessed values.
    fetchOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Could not load your order confirmation.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) return <FullPageSpinner />;

  if (error || !order) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-danger">{error || 'Order not found.'}</p>
        <Link to="/orders" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-4xl">✅</span>
      <h1 className="mt-4 text-2xl font-bold text-textPrimary">Order Placed!</h1>
      <p className="mt-1 text-sm text-textSecondary">Thank you for your purchase.</p>

      <div className="mt-6 rounded-xl bg-surface p-5 text-left shadow-card">
        <div className="flex justify-between text-sm">
          <span className="text-textSecondary">Order ID</span>
          <span className="font-mono text-textPrimary">{order._id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-textSecondary">
              <span>
                {item.name}
                {item.size || item.color ? ` (${[item.size, item.color].filter(Boolean).join(' / ')})` : ''} × {item.quantity}
              </span>
              <span className="text-textPrimary">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
          <span className="text-textSecondary">Subtotal</span>
          <span className="text-textPrimary">${order.subtotal.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
            <span>-${order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="font-bold text-textPrimary">Total</span>
          <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-textPrimary">
          Continue Shopping
        </Link>
        <Link to="/orders" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white">
          View My Orders
        </Link>
      </div>
    </div>
  );
}
