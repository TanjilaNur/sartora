import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { FullPageSpinner } from '../components/Spinner';

export default function WishlistPage() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-xl font-bold text-textPrimary">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">🤍</span>
          <p className="text-sm text-textSecondary">Products you save will show up here.</p>
          <Link to="/" className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Start Browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
