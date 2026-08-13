import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, fetchCategories } from '../api/productApi';
import type { Product, Category } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { Spinner } from '../components/Spinner';

export default function HomePage() {
  const { user, isLoggedIn } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Only the response matching the latest-issued request is ever applied —
  // prevents a slower, older filter/search combo from clobbering a newer one.
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (targetPage: number, categoryId: string, searchTerm: string) => {
      const requestId = ++requestIdRef.current;
      if (targetPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      setError('');
      try {
        const res = await fetchProducts({
          page: targetPage,
          limit: 20,
          category: categoryId || undefined,
          search: searchTerm || undefined,
        });
        if (requestId !== requestIdRef.current) return;
        setProducts((prev) => (targetPage === 1 ? res.products : [...prev, ...res.products]));
        setPage(res.page);
        setPages(res.pages);
      } catch {
        if (requestId === requestIdRef.current) setError('Failed to load products.');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    load(1, selectedCategoryId, search);
  }, [load, selectedCategoryId, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-primaryTint px-6 py-8 sm:px-10 sm:py-12">
        <h1 className="text-2xl font-bold text-onPrimaryTint sm:text-3xl">
          {isLoggedIn ? `Welcome back, ${user?.name}!` : 'Discover Your Style'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-onPrimaryTint/80 sm:text-base">
          Discover our latest collection of dresses, tops, and accessories — curated for every occasion.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search dresses…"
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-textPrimary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-textSecondary"
          >
            Clear
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategoryId('')}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            selectedCategoryId === ''
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface text-textSecondary'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedCategoryId(c._id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              selectedCategoryId === c._id
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-textSecondary'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-danger">{error}</p>
          <button
            onClick={() => load(1, selectedCategoryId, search)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-textPrimary">No products found</p>
          <p className="text-sm text-textSecondary">Try a different category or search term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {page < pages && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => load(page + 1, selectedCategoryId, search)}
                disabled={isLoadingMore}
                className="rounded-lg border border-primary px-6 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
