import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProduct } from '../api/productApi';
import { fetchProductReviews } from '../api/reviewApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import { categoryName, variantSizes, variantColors, findVariant, hasStockFor } from '../types/product';
import type { Review } from '../types/review';
import { reviewUserName } from '../types/review';
import { tryParseHexColor } from '../utils/color';
import { StarRating } from '../components/StarRating';
import { FullPageSpinner } from '../components/Spinner';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewAvg, setReviewAvg] = useState(0);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    setSelectedSize(undefined);
    setSelectedColor(undefined);
    setQuantity(1);
    setActiveImage(0);
    setAdding(false);
    setAddMessage(null);
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError('Failed to load this product.'))
      .finally(() => setIsLoading(false));

    fetchProductReviews(id, 1, 2)
      .then((res) => {
        setReviews(res.reviews);
        setReviewTotal(res.total);
        setReviewAvg(res.averageRating);
      })
      .catch(() => {});
  }, [id]);

  const sizes = product ? variantSizes(product) : [];
  const colors = product ? variantColors(product) : [];
  const needsSize = sizes.length > 0;
  const needsColor = colors.length > 0;
  const selectionComplete = (!needsSize || !!selectedSize) && (!needsColor || !!selectedColor);
  const matchedVariant =
    product && selectionComplete
      ? findVariant(product, { size: needsSize ? selectedSize : undefined, color: needsColor ? selectedColor : undefined })
      : undefined;
  const hasVariants = product ? product.variants.length > 0 : false;
  const effectivePrice = matchedVariant?.priceOverride ?? product?.price ?? 0;
  const effectiveStock = hasVariants ? matchedVariant?.stock ?? 0 : product?.stock ?? 0;

  const selectColor = useCallback((color: string) => {
    setSelectedColor((prev) => (prev === color ? undefined : color));
    setQuantity(1);
  }, []);

  const selectSize = useCallback((size: string) => {
    setSelectedSize((prev) => (prev === size ? undefined : size));
    setQuantity(1);
  }, []);

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    setAddMessage(null);
    const result = await addItem(product._id, quantity, matchedVariant?._id);
    setAddMessage({ ok: result.ok, text: result.ok ? 'Added to your cart!' : result.message ?? 'Failed to add item.' });
    setAdding(false);
  }

  if (isLoading) return <FullPageSpinner />;
  if (error || !product) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-danger">{error || 'Product not found.'}</p>
        <button onClick={() => navigate(-1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-primaryTint">
          {product.images[activeImage] ? (
            <img src={product.images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-primary">👗</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setActiveImage(i)}
                aria-label={`Show image ${i + 1} of ${product.images.length}`}
                aria-current={i === activeImage}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                  i === activeImage ? 'border-primary' : 'border-border'
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          {product.category && (
            <span className="w-fit rounded-full bg-primaryTint px-3 py-1 text-xs font-semibold text-onPrimaryTint">
              {categoryName(product.category)}
            </span>
          )}
          {isLoggedIn && (
            <button
              onClick={() => toggleWishlist(product)}
              aria-label={isWishlisted(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={isWishlisted(product._id)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg shadow-card transition-transform hover:scale-110"
            >
              {isWishlisted(product._id) ? '❤️' : '🤍'}
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-textPrimary">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-primary">${effectivePrice.toFixed(2)}</span>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              effectiveStock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            {effectiveStock > 0 ? `In Stock (${effectiveStock})` : 'Out of Stock'}
          </span>
        </div>

        {product.averageRating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={product.averageRating} />
            <span className="text-sm text-textSecondary">
              {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
        )}

        {needsColor && (
          <div>
            <p className="mb-2 text-sm font-semibold text-textPrimary">
              Color{selectedColor && !tryParseHexColor(selectedColor) ? `: ${selectedColor}` : ''}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((color) => {
                const selected = selectedColor === color;
                const available = selectedSize
                  ? hasStockFor(product, { size: selectedSize, color })
                  : hasStockFor(product, { color });
                const swatch = tryParseHexColor(color);
                return swatch ? (
                  <button
                    key={color}
                    disabled={!available}
                    onClick={() => selectColor(color)}
                    title={color}
                    className={`h-10 w-10 rounded-full border-2 disabled:opacity-30 ${
                      selected ? 'border-primary' : 'border-border'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ) : (
                  <button
                    key={color}
                    disabled={!available}
                    onClick={() => selectColor(color)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-semibold disabled:opacity-40 disabled:line-through ${
                      selected ? 'border-primary bg-primary text-white' : 'border-border text-textPrimary'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {needsSize && (
          <div>
            <p className="mb-2 text-sm font-semibold text-textPrimary">Size{selectedSize ? `: ${selectedSize}` : ''}</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const selected = selectedSize === size;
                const available = selectedColor
                  ? hasStockFor(product, { size, color: selectedColor })
                  : hasStockFor(product, { size });
                return (
                  <button
                    key={size}
                    disabled={!available}
                    onClick={() => selectSize(size)}
                    className={`min-w-11 rounded-lg border px-3.5 py-2 text-sm font-semibold disabled:opacity-40 disabled:line-through ${
                      selected ? 'border-primary bg-primary text-white' : 'border-border text-textPrimary'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasVariants && !selectionComplete && (
          <p className="text-sm text-danger">
            Please select a {[needsColor && !selectedColor && 'color', needsSize && !selectedSize && 'size'].filter(Boolean).join(' and ')}
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-textPrimary">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-9 w-9 rounded-lg border border-border text-textPrimary disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center font-semibold text-textPrimary">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
              disabled={quantity >= effectiveStock}
              className="h-9 w-9 rounded-lg border border-border text-textPrimary disabled:opacity-40"
            >
              +
            </button>
            <span className="ml-2 text-lg font-bold text-primary">${(effectivePrice * quantity).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || effectiveStock === 0 || !selectionComplete}
          className="rounded-lg bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>
        {addMessage && (
          <p className={`text-sm ${addMessage.ok ? 'text-success' : 'text-danger'}`}>{addMessage.text}</p>
        )}

        {product.description && (
          <div className="border-t border-border pt-4">
            <p className="mb-1 text-sm font-semibold text-textPrimary">Description</p>
            <p className="text-sm leading-relaxed text-textSecondary">{product.description}</p>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-textPrimary">
              Reviews {reviewTotal > 0 && `(${reviewAvg.toFixed(1)} · ${reviewTotal})`}
            </p>
            <Link to={`/product/${product._id}/reviews`} className="text-sm font-semibold text-primary">
              See all
            </Link>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-textSecondary">No reviews yet — be the first to review!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r._id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-textPrimary">{reviewUserName(r)}</span>
                    <StarRating rating={r.rating} size={12} />
                  </div>
                  {r.text && <p className="mt-0.5 text-sm text-textSecondary">{r.text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
