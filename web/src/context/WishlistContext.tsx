import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types/product';
import { useAuth } from './AuthContext';
import { fetchMyWishlist, addToWishlist, removeFromWishlist } from '../api/userApi';

interface WishlistContextValue {
  wishlist: Product[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlist([]);
      return;
    }
    setIsLoading(true);
    try {
      setWishlist(await fetchMyWishlist());
    } catch {
      // Non-critical — the heart icons just fall back to "not wishlisted".
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const isWishlisted = useCallback((productId: string) => wishlist.some((p) => p._id === productId), [wishlist]);

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const wasWishlisted = isWishlisted(product._id);
      // Optimistic update — a wishlist toggle should feel instant.
      setWishlist((prev) => (wasWishlisted ? prev.filter((p) => p._id !== product._id) : [...prev, product]));
      try {
        if (wasWishlisted) await removeFromWishlist(product._id);
        else await addToWishlist(product._id);
      } catch {
        // Roll back on failure.
        setWishlist((prev) =>
          wasWishlisted ? [...prev, product] : prev.filter((p) => p._id !== product._id)
        );
      }
    },
    [isWishlisted]
  );

  return (
    <WishlistContext.Provider value={{ wishlist, isLoading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
