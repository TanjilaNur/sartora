import { Link } from 'react-router-dom';
import type { Product } from '../types/product';
import { productImage, categoryName } from '../types/product';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock === 0;
  const image = productImage(product);
  const { isLoggedIn } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <Link
      to={`/product/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-surface shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-primaryTint">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-primary">👗</div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-sm font-semibold text-white">Out of Stock</span>
          </div>
        )}
        {isLoggedIn && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-base shadow-sm backdrop-blur transition-transform hover:scale-110 dark:bg-black/60"
          >
            {wishlisted ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="truncate text-sm font-semibold text-textPrimary">{product.name}</h3>
        {product.category && (
          <p className="truncate text-xs text-textSecondary">{categoryName(product.category)}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={product.averageRating} size={12} />
              <span className="text-xs text-textSecondary">{product.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
