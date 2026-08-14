import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import {
  fetchProductReviews,
  fetchMyReviews,
  addReview,
  editReview,
  deleteReview,
  reportReview,
} from '../api/reviewApi';
import type { Review } from '../types/review';
import { reviewUserName, reviewUserId } from '../types/review';
import { StarRating } from '../components/StarRating';
import { FullPageSpinner, Spinner } from '../components/Spinner';

export default function ProductReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('name') ?? 'Product';
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(
    async (targetPage: number) => {
      if (!id) return;
      if (targetPage === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const res = await fetchProductReviews(id, targetPage, 20);
        setReviews((prev) => (targetPage === 1 ? res.reviews : [...prev, ...res.reviews]));
        setPage(res.page);
        setPages(res.pages);
        setTotal(res.total);
        setAverage(res.averageRating);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    if (!isLoggedIn || !id) {
      setHasUserReviewed(false);
      return;
    }
    fetchMyReviews()
      .then((mine) => setHasUserReviewed(mine.some((r) => (typeof r.product === 'string' ? r.product : r.product._id) === id)))
      .catch(() => {});
  }, [isLoggedIn, id]);

  async function handleDelete(reviewId: string) {
    if (!confirm('Remove your review?')) return;
    setActionError('');
    try {
      await deleteReview(reviewId);
      setHasUserReviewed(false);
      load(1);
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to delete review.'));
    }
  }

  async function handleReport(reviewId: string) {
    setActionError('');
    try {
      await reportReview(reviewId);
      alert('Review has been flagged for moderation.');
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to report review.'));
    }
  }

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-textSecondary hover:text-primary">
        ← Back to {productName}
      </button>

      <div className="mb-6 flex items-center gap-6 rounded-xl bg-surface p-6 shadow-card">
        <span className="text-4xl font-bold text-textPrimary">{average.toFixed(1)}</span>
        <div>
          <StarRating rating={average} size={20} />
          <p className="mt-1 text-sm text-textSecondary">{total} review{total === 1 ? '' : 's'}</p>
        </div>
        {isLoggedIn && !hasUserReviewed && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Write Review
          </button>
        )}
      </div>

      {actionError && <p className="mb-4 text-sm text-danger">{actionError}</p>}

      {reviews.length === 0 ? (
        <p className="py-12 text-center text-sm text-textSecondary">No reviews yet — be the first to review!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => {
            const isOwn = isLoggedIn && reviewUserId(r) === user?.id;
            return (
              <div key={r._id} className="rounded-xl bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-textPrimary">{reviewUserName(r)}</span>
                      {r.verified && (
                        <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          Verified
                        </span>
                      )}
                    </div>
                    <StarRating rating={r.rating} size={13} className="mt-1" />
                  </div>
                  <div className="flex gap-3 text-xs">
                    {isOwn ? (
                      <>
                        <button
                          onClick={() => {
                            setEditing(r);
                            setShowForm(true);
                          }}
                          className="text-textSecondary hover:text-primary"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(r._id)} className="text-danger">
                          Delete
                        </button>
                      </>
                    ) : (
                      isLoggedIn && (
                        <button onClick={() => handleReport(r._id)} className="text-textSecondary hover:text-warning">
                          Report
                        </button>
                      )
                    )}
                  </div>
                </div>
                {r.text && <p className="mt-2 text-sm text-textSecondary">{r.text}</p>}
              </div>
            );
          })}
          {page < pages && (
            <button
              onClick={() => load(page + 1)}
              disabled={isLoadingMore}
              className="mx-auto rounded-lg border border-primary px-6 py-2 text-sm font-semibold text-primary"
            >
              {isLoadingMore ? <Spinner size={16} /> : 'Load More'}
            </button>
          )}
        </div>
      )}

      {showForm && id && (
        <ReviewFormModal
          productId={id}
          existing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setHasUserReviewed(true);
            load(1);
          }}
        />
      )}
    </div>
  );
}

function ReviewFormModal({
  productId,
  existing,
  onClose,
  onSaved,
}: {
  productId: string;
  existing: Review | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [text, setText] = useState(existing?.text ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      if (existing) await editReview(existing._id, rating, text.trim());
      else await addReview(productId, rating, text.trim());
      onSaved();
    } catch {
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-modal sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-textPrimary">{existing ? 'Edit Review' : 'Write a Review'}</h2>
        <div className="mt-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="text-3xl">
              {star <= rating ? '★' : '☆'}
              <span className="sr-only">{star} stars</span>
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          aria-label="Your review"
          placeholder="Share your experience (optional)"
          className="mt-4 w-full rounded-lg border border-border bg-page p-3 text-sm text-textPrimary outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-textPrimary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : existing ? 'Update' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
