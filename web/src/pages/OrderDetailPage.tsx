import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchOrder, cancelOrder, fetchInvoice } from '../api/orderApi';
import { requestRefund, fetchMyRefund } from '../api/refundApi';
import { errorMessage } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Order, OrderStatus } from '../types/order';
import type { Refund } from '../types/refund';
import type { Invoice } from '../types/order';
import { FullPageSpinner } from '../components/Spinner';
import { STATUS_COLORS, PAYMENT_COLORS } from '../utils/orderColors';

const TRACKING_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { reorder } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [refund, setRefund] = useState<Refund | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [reordering, setReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState('');

  const load = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const o = await fetchOrder(orderId);
      setOrder(o);
      // Fetched independently of the order: an unrelated hiccup on this
      // endpoint (a stray 500, a timeout) shouldn't hide an order that
      // loaded just fine. `refund` simply stays whatever it last was.
      try {
        setRefund(await fetchMyRefund(orderId));
      } catch {
        /* non-fatal — see comment above */
      }
    } catch {
      setError('Failed to load order.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel() {
    if (!orderId || !confirm('Cancel this order?')) return;
    setBusy(true);
    setActionError('');
    try {
      await cancelOrder(orderId);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to cancel order.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestRefund() {
    if (!orderId || !refundReason.trim()) return;
    setBusy(true);
    setActionError('');
    try {
      const r = await requestRefund(orderId, refundReason.trim());
      setRefund(r);
      setShowRefundForm(false);
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to submit refund request.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleViewInvoice() {
    if (!orderId) return;
    setActionError('');
    try {
      setInvoice(await fetchInvoice(orderId));
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to load invoice.'));
    }
  }

  async function handleReorder() {
    if (!order) return;
    setReordering(true);
    setReorderMessage('');
    try {
      const { succeeded, failed } = await reorder(order);
      if (succeeded > 0 && failed === 0) setReorderMessage('Added to Cart');
      else if (succeeded > 0 && failed > 0) setReorderMessage(`Partially Added — ${failed} item(s) unavailable`);
      else setReorderMessage('Could Not Reorder — items are no longer available');
    } finally {
      setReordering(false);
    }
  }

  if (isLoading) return <FullPageSpinner />;
  if (error || !order) return <p className="py-16 text-center text-danger">{error || 'Order not found.'}</p>;

  const canCancel = order.status === 'pending';
  // Mirrors backend/src/api/refunds/refund.service.ts::createRefundRequest
  // exactly: eligible if paid (or already delivered) and not already
  // refunded, and only blocked by an existing request that's still
  // pending/approved — a rejected one doesn't block trying again.
  const canRefund =
    order.paymentStatus !== 'refunded' &&
    (order.paymentStatus === 'paid' || order.status === 'delivered') &&
    (!refund || refund.status === 'rejected');

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate('/orders')} className="mb-4 text-sm text-textSecondary hover:text-primary">
        ← Back to Orders
      </button>

      <div className="rounded-xl bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-lg font-bold text-textPrimary">#{order._id.slice(-8).toUpperCase()}</h1>
          <span className="text-sm text-textSecondary">{new Date(order.createdAt).toLocaleString()}</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-textSecondary">
                {item.name}
                {item.size || item.color ? ` (${[item.size, item.color].filter(Boolean).join(' / ')})` : ''} × {item.quantity}
              </span>
              <span className="text-textPrimary">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">Subtotal</span>
            <span className="text-textPrimary">${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-border pt-2">
            <span className="font-bold text-textPrimary">Total</span>
            <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${PAYMENT_COLORS[order.paymentStatus]}`}>
            {order.paymentStatus.toUpperCase()}
          </span>
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
            {order.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-4 border-t border-border pt-4 text-sm text-textSecondary">
          <p className="mb-1 font-semibold text-textPrimary">Delivery Address</p>
          <p>
            {order.address.street}, {order.address.city}, {order.address.state} {order.address.zip}, {order.address.country}
          </p>
        </div>

        {order.status !== 'cancelled' && <TrackingCard order={order} />}

        {refund && (
          <div className="mt-4 rounded-lg bg-page p-3 text-sm">
            <p className="font-semibold text-textPrimary">
              Refund request: <span className="capitalize">{refund.status}</span>
            </p>
            <p className="text-textSecondary">{refund.reason}</p>
            {refund.adminNote && <p className="mt-1 text-xs text-textSecondary">Note: {refund.adminNote}</p>}
          </div>
        )}

        {actionError && <p className="mt-4 text-sm text-danger">{actionError}</p>}
        {reorderMessage && <p className="mt-4 text-sm text-textSecondary">{reorderMessage}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary disabled:opacity-60"
          >
            {reordering ? 'Adding…' : 'Reorder'}
          </button>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={busy}
              className="rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-60"
            >
              Cancel Order
            </button>
          )}
          {canRefund && (
            <button
              onClick={() => setShowRefundForm(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-textPrimary"
            >
              Request Refund
            </button>
          )}
          <button onClick={handleViewInvoice} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-textPrimary">
            View Invoice
          </button>
        </div>

        {showRefundForm && (
          <div className="mt-4 rounded-lg border border-border p-4">
            <label className="mb-1.5 block text-sm font-semibold text-textPrimary" htmlFor="refund-reason">
              Reason for refund
            </label>
            <textarea
              id="refund-reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Tell us why you'd like a refund…"
              rows={3}
              className="w-full rounded-lg border border-border bg-page p-3 text-sm text-textPrimary outline-none focus:border-primary"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setShowRefundForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRefund}
                disabled={busy || !refundReason.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>

      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setInvoice(null)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-textPrimary">Invoice {invoice.invoiceNumber}</h2>
            <p className="text-xs text-textSecondary">{new Date(invoice.issuedAt).toLocaleString()}</p>
            <div className="mt-4 flex flex-col gap-1.5 text-sm">
              {invoice.lineItems.map((li, i) => (
                <div key={i} className="flex justify-between text-textSecondary">
                  <span>
                    {li.name} × {li.quantity}
                  </span>
                  <span className="text-textPrimary">${li.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold text-textPrimary">
              <span>Total</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setInvoice(null)}
              className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Link to="/" className="mt-4 block text-center text-sm text-textSecondary hover:text-primary">
        Continue Shopping
      </Link>
    </div>
  );
}

// A flat status label communicates less than seeing where an order actually
// sits in its journey, so this derives a simple step tracker from the
// existing status enum rather than needing a separate event-log the admin
// would have to maintain (mirrors mobile's order_detail_screen.dart _TrackingCard).
function TrackingCard({ order }: { order: Order }) {
  const currentIndex = Math.max(0, TRACKING_STEPS.indexOf(order.status));

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-4 text-sm font-semibold text-textPrimary">Order Tracking</p>
      <div className="flex items-center">
        {TRACKING_STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                  done ? 'border-success bg-success text-white' : 'border-border bg-page text-transparent'
                }`}
              >
                {done ? '✓' : ''}
              </div>
              {i < TRACKING_STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between">
        {TRACKING_STEPS.map((step, i) => (
          <span
            key={step}
            className={`text-[10px] capitalize ${
              i === currentIndex ? 'font-bold text-success' : i < currentIndex ? 'text-success' : 'text-textSecondary'
            }`}
          >
            {step}
          </span>
        ))}
      </div>
      {order.trackingNumber && (
        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">Carrier</span>
            <span className="font-medium text-textPrimary">{order.carrier || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Tracking #</span>
            <span className="font-medium text-textPrimary">{order.trackingNumber}</span>
          </div>
        </div>
      )}
    </div>
  );
}
