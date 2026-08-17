import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Cart } from '../types/cart';
import type { CheckoutResponse, Order } from '../types/order';
import { useAuth } from './AuthContext';
import * as cartApi from '../api/cartApi';
import * as guestApi from '../api/guestApi';
import * as orderApi from '../api/orderApi';
import { getGuestId, saveGuestId, clearGuestId, errorMessage } from '../api/client';

interface AddResult {
  ok: boolean;
  message?: string;
}

interface CheckoutInput {
  address: Record<string, string>;
  paymentMethod: string;
  promoCode?: string;
}

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  isMerging: boolean;
  isSubmitting: boolean;
  error: string;
  isGuest: boolean;
  hasGuestSession: boolean;
  itemCount: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<AddResult>;
  updateItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  startGuestSession: () => Promise<void>;
  checkout: (input: CheckoutInput) => Promise<CheckoutResponse | null>;
  reorder: (order: Order) => Promise<{ succeeded: number; failed: number }>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  // Starts true (not false): the very first render happens before the fetch
  // effect below has run, and a false-then-flip-true `isLoading` let pages
  // briefly render their "cart is empty" state on every fresh load, even for
  // a returning customer whose cart actually has items.
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guestId, setGuestIdState] = useState<string | null>(() => getGuestId());
  const prevTokenRef = useRef(token);
  // Guards against two overlapping fetchCart() calls (e.g. the plain
  // token/guestId effect and the post-merge fetch both firing around
  // login) resolving out of order and letting a stale response clobber a
  // newer one.
  const fetchRequestIdRef = useRef(0);

  const fetchCart = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);
    setError('');
    try {
      let result: Cart;
      if (token) {
        result = await cartApi.fetchCart();
      } else if (guestId) {
        result = await guestApi.fetchGuestCart(guestId);
      } else {
        result = { items: [], total: 0 };
      }
      if (requestId === fetchRequestIdRef.current) setCart(result);
    } catch (err) {
      if (requestId === fetchRequestIdRef.current) setError(errorMessage(err, 'Failed to load cart.'));
    } finally {
      if (requestId === fetchRequestIdRef.current) setIsLoading(false);
    }
  }, [token, guestId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Auto-provision a guest session so browsing and cart actions work the
  // instant someone lands on the site — unlike the mobile app, a storefront
  // needs to be browsable without an explicit "Continue as Guest" tap first.
  useEffect(() => {
    if (!token && !guestId) {
      const create = async () => {
        // Re-check once inside the lock: by the time this callback actually
        // gets to run, another tab may have already created and persisted
        // a session while this one was waiting its turn.
        const existing = getGuestId();
        if (existing) {
          setGuestIdState(existing);
          return;
        }
        const id = await guestApi.createGuestSession();
        saveGuestId(id);
        setGuestIdState(id);
      };
      // The Web Locks API serializes this across every tab of the same
      // origin, so two tabs opened together can't both create (and
      // orphan) a guest session — the second tab's callback only starts
      // once the first tab's has finished persisting to localStorage.
      // Falls back to a best-effort, non-atomic create on browsers
      // without navigator.locks (e.g. pre-2022 Safari): a lost race there
      // just orphans one GuestCart row, which the model's 7-day TTL index
      // already cleans up on its own.
      if (typeof navigator !== 'undefined' && navigator.locks) {
        navigator.locks.request('sartora-guest-session', create).catch(() => {});
      } else {
        create().catch(() => {});
      }
    }
  }, [token, guestId]);

  // A fresh login/register (token appears where there wasn't one) merges
  // whatever was in the guest cart into the now-authenticated cart — mirrors
  // AuthController calling GuestController.mergeCartIntoUser() on login in
  // the mobile app.
  useEffect(() => {
    const hadToken = !!prevTokenRef.current;
    const hasToken = !!token;
    prevTokenRef.current = token;
    if (!hadToken && hasToken && guestId) {
      setIsMerging(true);
      guestApi
        .mergeGuestCart(guestId)
        .then(() => {
          // Only drop the guest session once the merge actually landed —
          // on failure, keep it so the items aren't silently lost; the
          // next login attempt will retry the merge with the same guestId.
          clearGuestId();
          setGuestIdState(null);
        })
        .catch((err) => {
          setError(errorMessage(err, 'Could not merge your guest cart into your account. Your items are still saved — try refreshing.'));
        })
        .finally(() => {
          fetchCart();
          setIsMerging(false);
        });
    }
  }, [token, guestId, fetchCart]);

  const startGuestSession = useCallback(async () => {
    const id = await guestApi.createGuestSession();
    saveGuestId(id);
    setGuestIdState(id);
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity: number, variantId?: string): Promise<AddResult> => {
      try {
        if (token) {
          setCart(await cartApi.addToCart(productId, quantity, variantId));
        } else if (guestId) {
          setCart(await guestApi.addToGuestCart(guestId, productId, quantity, variantId));
        } else {
          return { ok: false, message: 'Please sign in or continue as a guest to add items to your cart.' };
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, message: errorMessage(err, 'Failed to add item to cart.') };
      }
    },
    [token, guestId]
  );

  const updateItem = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      try {
        if (token) {
          setCart(await cartApi.updateCartItem(productId, quantity, variantId));
        } else if (guestId) {
          setCart(await guestApi.updateGuestCartItem(guestId, productId, quantity, variantId));
        }
      } catch (err) {
        setError(errorMessage(err, 'Failed to update item.'));
      }
    },
    [token, guestId]
  );

  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      try {
        if (token) {
          setCart(await cartApi.removeFromCart(productId, variantId));
        } else if (guestId) {
          setCart(await guestApi.removeFromGuestCart(guestId, productId, variantId));
        }
      } catch (err) {
        setError(errorMessage(err, 'Failed to remove item.'));
      }
    },
    [token, guestId]
  );

  const checkout = useCallback(async (input: CheckoutInput): Promise<CheckoutResponse | null> => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await orderApi.checkout(input);
      await fetchCart();
      return result;
    } catch (err) {
      setError(errorMessage(err, 'Could not place order. Please try again.'));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCart]);

  // Adds every item from a past order back into the current cart. Items
  // whose product/variant no longer exists or is out of stock are skipped
  // individually rather than failing the whole reorder — the caller decides
  // how to summarize succeeded/failed for the user.
  const reorder = useCallback(
    async (order: Order): Promise<{ succeeded: number; failed: number }> => {
      let succeeded = 0;
      let failed = 0;
      for (const item of order.items) {
        if (!item.product) {
          failed++;
          continue;
        }
        const result = await addItem(item.product, item.quantity, item.variant);
        if (result.ok) succeeded++;
        else failed++;
      }
      return { succeeded, failed };
    },
    [addItem]
  );

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isMerging,
        isSubmitting,
        error,
        isGuest: !token,
        hasGuestSession: !!guestId,
        itemCount,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        startGuestSession,
        checkout,
        reorder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
