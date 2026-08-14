import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFaqs, fetchFaqCategories } from '../api/faqApi';
import { errorMessage } from '../api/client';
import type { Faq } from '../types/faq';
import { FullPageSpinner } from '../components/Spinner';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Guards against rapid category-chip taps: only the response matching the
  // latest-issued request is ever applied.
  const requestIdRef = useRef(0);

  useEffect(() => {
    fetchFaqCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const load = useCallback(async (category: string) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetchFaqs(category || undefined);
      if (requestId === requestIdRef.current) setFaqs(res);
    } catch (err) {
      if (requestId === requestIdRef.current) setError(errorMessage(err, 'Failed to load FAQs.'));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedCategory);
  }, [load, selectedCategory]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-textPrimary">Frequently Asked Questions</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${
            selectedCategory === '' ? 'border-primary bg-primary text-white' : 'border-border text-textSecondary'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              selectedCategory === c ? 'border-primary bg-primary text-white' : 'border-border text-textSecondary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <p className="py-8 text-center text-sm text-danger">{error}</p>
      ) : faqs.length === 0 ? (
        <p className="py-8 text-center text-sm text-textSecondary">No FAQs in this category yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {faqs.map((f) => {
            const open = openId === f._id;
            return (
              <div key={f._id} className="rounded-lg bg-surface shadow-card">
                <button
                  onClick={() => setOpenId(open ? null : f._id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-textPrimary">{f.question}</span>
                  <span className="text-textSecondary">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="border-t border-border p-4 text-sm text-textSecondary">{f.answer}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
