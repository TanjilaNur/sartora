import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { variantLabel, variantSwatch } from '../types/cart';
import { FullPageSpinner } from '../components/Spinner';

export default function CartPage() {
  const { cart, isLoading, error, isGuest, updateItem, removeItem } = useCart();
  const navigate = useNavigate();

  function handleCheckoutClick() {
    if (isGuest) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  }

  if (isLoading && !cart) return <FullPageSpinner />;

  if (error && (!cart || cart.items.length === 0)) {
    return <p className="py-16 text-center text-danger">{error}</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primaryTint text-4xl">🛍️</span>
        <p className="text-lg font-semibold text-textPrimary">Your cart is empty</p>
        <p className="text-sm text-textSecondary">Add some dresses to get started.</p>
        <Link to="/" className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-textPrimary">My Cart</h1>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        {cart.items.map((item) => {
          const label = variantLabel(item.variant);
          const swatch = variantSwatch(item.variant);
          const key = `${item.product._id}-${item.variant?.id ?? 'none'}`;
          // A variant's own stock (when this line has one) is the real cap —
          // the product's aggregate stock sums every variant, so capping on
          // that let you increment well past what this specific size/color
          // actually has, silently no-op'ing once the server rejected it.
          const availableStock = item.variant ? item.variant.stock : item.product.stock;
          const unitPrice = item.subtotal / item.quantity;
          return (
            <div key={key} className="flex gap-4 rounded-xl bg-surface p-4 shadow-card">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-primaryTint">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">👗</div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <p className="font-semibold text-textPrimary">{item.product.name}</p>
                {(label || swatch) && (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {swatch && <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: swatch }} />}
                    {label && <span className="text-xs text-textSecondary">{label}</span>}
                  </div>
                )}
                <p className="mt-0.5 text-sm text-textSecondary">${unitPrice.toFixed(2)} each</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => updateItem(item.product._id, item.quantity - 1, item.variant?.id)}
                    className="h-7 w-7 rounded border border-border text-sm text-textPrimary"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-textPrimary">{item.quantity}</span>
                  <button
                    onClick={() => updateItem(item.product._id, item.quantity + 1, item.variant?.id)}
                    disabled={item.quantity >= availableStock}
                    className="h-7 w-7 rounded border border-border text-sm text-textPrimary disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="ml-auto font-bold text-primary">${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.product._id, item.variant?.id)}
                className="self-start text-danger"
                aria-label={`Remove ${item.product.name}${label ? ` (${label})` : ''} from cart`}
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface p-5 shadow-card">
        <div>
          <p className="text-xs text-textSecondary">Total</p>
          <p className="text-xl font-bold text-textPrimary">${cart.total.toFixed(2)}</p>
        </div>
        <button onClick={handleCheckoutClick} className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white">
          Proceed to Checkout
        </button>
      </div>
      {isGuest && (
        <p className="text-center text-sm text-textSecondary">
          <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="font-semibold text-primary">
            Sign in
          </Link>{' '}
          to complete your purchase — your cart will be saved.
        </p>
      )}
    </div>
  );
}
