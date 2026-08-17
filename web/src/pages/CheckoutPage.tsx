import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { validatePromo } from '../api/promotionApi';
import { createPaymentIntent } from '../api/paymentApi';
import { fetchMyAddresses } from '../api/userApi';
import type { PromoValidation } from '../types/promotion';
import type { Address } from '../types/user';
import { stripePromise } from '../stripe';
import { Spinner, FullPageSpinner } from '../components/Spinner';

type PaymentMethod = 'stripe' | 'cod' | 'bank_transfer';

export default function CheckoutPage() {
  const { cart, isLoading, isMerging, isSubmitting, checkout } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'US' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  useEffect(() => {
    fetchMyAddresses()
      .then((addresses) => {
        setSavedAddresses(addresses);
        // Auto-apply the default address — a manual loop rather than .find()
        // so there's no ambiguity if more than one is somehow flagged default.
        for (const a of addresses) {
          if (a.isDefault) {
            applyAddress(a);
            break;
          }
        }
      })
      .catch(() => {
        // Non-critical — checkout still works with a blank address form.
      });
  }, []);

  function applyAddress(a: Address) {
    setAddress({ street: a.street, city: a.city, state: a.state, zip: a.zip, country: a.country });
    setShowAddressPicker(false);
  }

  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<PromoValidation | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<{ amount: number; currency: string } | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  // React state updates from setCreatingIntent(true) don't apply until the
  // next render, leaving a window where a fast double-click/double-Enter can
  // fire handleSubmit twice before the button's disabled attribute catches
  // up — this ref blocks re-entrancy synchronously, closing that window.
  const submittingRef = useRef(false);

  // Once a Stripe PaymentIntent has been created, the order already exists
  // server-side and is awaiting payment — don't bounce the user away from
  // the PaymentElement just because the cart looks empty at that point.
  const inStripePaymentStep = Boolean(clientSecret && pendingOrderId);

  // Redirecting on an empty cart has to happen in an effect, not during
  // render: calling navigate() (which updates Router state) while
  // CheckoutPage is still rendering triggers React's "Cannot update a
  // component while rendering a different component" warning, since it
  // synchronously schedules an update to a different component (the
  // router) mid-render instead of after commit.
  useEffect(() => {
    if (!isLoading && !isMerging && (!cart || cart.items.length === 0) && !inStripePaymentStep) {
      navigate('/cart', { replace: true });
    }
  }, [cart, isLoading, isMerging, inStripePaymentStep, navigate]);

  async function handleApplyPromo() {
    if (!promoCode.trim() || !cart) return;
    setValidatingPromo(true);
    setPromoError('');
    try {
      const result = await validatePromo(promoCode, cart.total);
      setPromo(result);
    } catch {
      setPromo(null);
      setPromoError('Invalid or expired promo code.');
    } finally {
      setValidatingPromo(false);
    }
  }

  function clearPromo() {
    setPromo(null);
    setPromoCode('');
    setPromoError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    try {
      if (paymentMethod === 'stripe') {
        setCreatingIntent(true);
        try {
          const result = await createPaymentIntent({ address, promoCode: promo?.promoCode });
          setClientSecret(result.clientSecret);
          setPendingOrderId(result.orderId);
          setPendingAmount({ amount: result.amount, currency: result.currency });
        } catch {
          setError('Could not start payment. Please try again.');
        } finally {
          setCreatingIntent(false);
        }
        return;
      }

      const order = await checkout({ address, paymentMethod, promoCode: promo?.promoCode });
      if (order) {
        navigate(`/order-confirmation/${order.orderId}`);
      } else {
        setError('Could not place order. Please try again.');
      }
    } finally {
      submittingRef.current = false;
    }
  }

  // Mirrors CartPage's isLoading/!cart check: on a hard refresh or direct
  // deep link to /checkout, the cart hasn't been fetched yet on the first
  // render (it starts out null), which looks identical to "empty" — without
  // this, that transient state would trip the empty-cart redirect below and
  // bounce the user to /cart even though their cart has items.
  if ((isLoading && !cart) || isMerging) {
    return <FullPageSpinner />;
  }

  if (clientSecret && pendingOrderId) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-xl font-bold text-textPrimary">Payment</h1>
        {pendingAmount && (
          <p className="mb-4 text-sm text-textSecondary">
            You're authorizing a charge of{' '}
            <span className="font-bold text-textPrimary">
              {(pendingAmount.amount / 100).toLocaleString('en-US', {
                style: 'currency',
                currency: pendingAmount.currency,
              })}
            </span>
          </p>
        )}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm orderId={pendingOrderId} />
        </Elements>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    // The effect above will navigate to /cart; render nothing in the
    // meantime rather than touching cart.items/cart.total below.
    return null;
  }

  const subtotal = cart.total;
  const displayTotal = promo ? promo.finalTotal : subtotal;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-textPrimary">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl bg-surface p-5 shadow-card">
          <h2 className="mb-3 font-bold text-textPrimary">Order Summary</h2>
          <div className="flex flex-col gap-1.5 text-sm">
            {cart.items.map((item, i) => (
              <div key={i} className="flex justify-between text-textSecondary">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium text-textPrimary">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-textSecondary">Subtotal</span>
            <span className="text-textPrimary">${subtotal.toFixed(2)}</span>
          </div>
          {promo && (
            <div className="flex justify-between text-sm text-success">
              <span>Promo ({promo.promoCode})</span>
              <span>-${promo.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span className="font-bold text-textPrimary">Total</span>
            <span className="text-lg font-bold text-primary">${displayTotal.toFixed(2)}</span>
          </div>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-card">
          <h2 className="mb-3 font-bold text-textPrimary">Promo Code</h2>
          {promo ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5">
              <span className="flex-1 text-sm font-semibold text-success">
                {promo.promoCode} — ${promo.discount.toFixed(2)} off
              </span>
              <button type="button" onClick={clearPromo} className="text-textSecondary">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm uppercase tracking-wide text-textPrimary outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={validatingPromo}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {validatingPromo ? <Spinner size={16} /> : 'Apply'}
              </button>
            </div>
          )}
          {promoError && <p className="mt-2 text-sm text-danger">{promoError}</p>}
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-textPrimary">Delivery Address</h2>
            {savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddressPicker((v) => !v)}
                className="text-sm font-semibold text-onPrimaryTint"
              >
                Saved Addresses
              </button>
            )}
          </div>
          {showAddressPicker && (
            <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border p-2">
              {savedAddresses.map((a) => (
                <button
                  key={a._id}
                  type="button"
                  onClick={() => applyAddress(a)}
                  className="rounded-lg p-2 text-left text-sm hover:bg-page"
                >
                  <span className="font-semibold text-textPrimary">{a.label}</span>
                  {a.isDefault && (
                    <span className="ml-2 rounded bg-primaryTint px-1.5 py-0.5 text-[10px] font-bold text-onPrimaryTint">DEFAULT</span>
                  )}
                  <p className="text-textSecondary">
                    {a.street}, {a.city}, {a.state} {a.zip}, {a.country}
                  </p>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <input
              required
              placeholder="Street Address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
              />
              <input
                required
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="ZIP Code"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
              />
              <input
                required
                placeholder="Country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="rounded-lg border border-border bg-page px-3.5 py-2.5 text-sm text-textPrimary outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-card">
          <h2 className="mb-3 font-bold text-textPrimary">Payment Method</h2>
          <div className="flex flex-col gap-2">
            {(
              [
                { value: 'stripe', label: 'Credit / Debit Card', sub: 'Powered by Stripe — secure & encrypted', icon: '💳' },
                { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
                { value: 'bank_transfer', label: 'Bank Transfer', sub: 'Manual bank deposit', icon: '🏦' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  paymentMethod === opt.value ? 'border-primary bg-primaryTint' : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="accent-primary"
                />
                <span className="text-xl">{opt.icon}</span>
                <span>
                  <span className="block text-sm font-semibold text-textPrimary">{opt.label}</span>
                  <span className="block text-xs text-textSecondary">{opt.sub}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || creatingIntent}
          className="rounded-lg bg-primary py-3.5 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting || creatingIntent ? 'Processing…' : paymentMethod === 'stripe' ? 'Continue to Payment' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}

function StripePaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed.');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      navigate(`/order-confirmation/${orderId}`);
      return;
    }

    // Stripe can report a soft decline (e.g. requires_payment_method again)
    // without populating `error` — fall back to a generic message so the
    // button doesn't just silently reset with no explanation.
    setError('Payment was not completed. Please check your card details and try again.');
    setIsProcessing(false);
  }

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-card">
      <PaymentElement />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="rounded-lg bg-primary py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isProcessing ? 'Confirming…' : 'Pay Now'}
      </button>
    </form>
  );
}
