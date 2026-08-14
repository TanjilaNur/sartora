interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

/** Renders a fractional star rating (e.g. 3.7) via a clipped overlay rather
 * than a half-star glyph, so any fraction — not just halves — renders
 * correctly regardless of font support. */
export function StarRating({ rating, size = 16, className = '' }: StarRatingProps) {
  // A missing/NaN rating (e.g. a review with no score yet) must render as
  // empty, not fall through to 100% — width:NaN% is invalid CSS and gets
  // dropped, and the overlay's own inset-0 would otherwise default it to
  // full width, displaying an unrated item as a perfect 5 stars.
  const pct = Number.isFinite(rating) ? Math.max(0, Math.min(100, (rating / 5) * 100)) : 0;
  return (
    <div className={`relative inline-block leading-none whitespace-nowrap ${className}`} style={{ fontSize: size }}>
      <div className="text-neutral-300">★★★★★</div>
      <div className="absolute inset-0 overflow-hidden text-secondary" style={{ width: `${pct}%` }}>
        ★★★★★
      </div>
    </div>
  );
}
