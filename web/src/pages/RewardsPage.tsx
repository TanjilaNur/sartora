import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyPoints, fetchMyBadges, fetchLeaderboard } from '../api/pointsApi';
import { errorMessage } from '../api/client';
import type { PointsLedgerEntry, EarnedBadge, Badge, BadgeCriteria, LeaderboardEntry } from '../types/points';
import { FullPageSpinner, Spinner } from '../components/Spinner';

type Tab = 'points' | 'badges' | 'leaderboard';

export default function RewardsPage() {
  const [tab, setTab] = useState<Tab>('points');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-textPrimary">Rewards</h1>
      <div className="mb-6 flex gap-6 border-b border-border">
        {(['points', 'badges', 'leaderboard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-textSecondary'
            }`}
          >
            {t === 'points' ? 'Points History' : t}
          </button>
        ))}
      </div>
      {tab === 'points' && <PointsTab />}
      {tab === 'badges' && <BadgesTab />}
      {tab === 'leaderboard' && <LeaderboardTab />}
    </div>
  );
}

function PointsTab() {
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<PointsLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage: number) => {
    if (targetPage === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setError('');
    try {
      const res = await fetchMyPoints(targetPage);
      setBalance(res.balance);
      setEntries((prev) => (targetPage === 1 ? res.entries : [...prev, ...res.entries]));
      setPage(res.page);
      setPages(res.pages);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load points history.'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  if (isLoading) return <FullPageSpinner />;
  if (error) return <p className="py-8 text-center text-danger">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 rounded-xl bg-primaryTint py-8">
        <span className="text-4xl">⭐</span>
        <span className="text-3xl font-bold text-onPrimaryTint">{balance}</span>
        <span className="text-sm text-onPrimaryTint/80">Total Points</span>
      </div>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-textSecondary">No points activity yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e._id} className="flex items-center justify-between rounded-lg bg-surface p-3.5 shadow-card">
              <div>
                <p className="text-sm font-medium text-textPrimary">{e.description}</p>
                <p className="text-xs text-textSecondary">{new Date(e.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="font-bold text-success">+{e.points}</span>
            </div>
          ))}
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
      <HowToEarnCard />
    </div>
  );
}

// Point values shown here are informational copy, matching the mobile app's
// hardcoded card — they mirror POINTS_TABLE in
// backend/src/api/points/points.service.ts but aren't fetched from it.
function HowToEarnCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primaryTint p-4">
      <p className="mb-2.5 text-sm font-semibold text-onPrimaryTint">How to earn points</p>
      <div className="flex flex-col gap-1.5 text-sm text-onPrimaryTint">
        <p>👤 Sign up — 50 pts</p>
        <p>🛍️ Make a purchase — 10 pts</p>
        <p>⭐ Write a review — 20 pts</p>
      </div>
    </div>
  );
}

// Matches mobile's _criteriaLabel in badges_screen.dart exactly.
function criteriaLabel(c: BadgeCriteria): string {
  switch (c.type) {
    case 'order_count':
      return `${c.value} order${c.value === 1 ? '' : 's'}`;
    case 'review_count':
      return `${c.value} review${c.value === 1 ? '' : 's'}`;
    case 'points_threshold':
      return `${c.value} pts`;
    default:
      return '';
  }
}

function BadgesTab() {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [locked, setLocked] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyBadges()
      .then((res) => {
        setEarned(res.earned);
        setLocked(res.locked.map((l) => l.badge));
      })
      .catch(() => setError('Failed to load badges.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (error) return <p className="py-8 text-center text-danger">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-textPrimary">Earned ({earned.length})</h2>
        {earned.length === 0 ? (
          <p className="text-sm text-textSecondary">No badges earned yet — keep shopping!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {earned.map((e) => (
              <div key={e.badge._id} className="flex flex-col items-center gap-1 rounded-xl bg-surface p-4 text-center shadow-card">
                <span className="text-3xl">{e.badge.icon}</span>
                <span className="text-sm font-semibold text-textPrimary">{e.badge.name}</span>
                <span className="text-xs text-textSecondary">{e.badge.description}</span>
                <span className="text-xs font-medium text-primary">{criteriaLabel(e.badge.criteria)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-textPrimary">Locked ({locked.length})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {locked.map((b) => (
            <div key={b._id} className="flex flex-col items-center gap-1 rounded-xl bg-surface p-4 text-center opacity-50 shadow-card">
              <span className="text-3xl grayscale">{b.icon}</span>
              <span className="text-sm font-semibold text-textPrimary">{b.name}</span>
              <span className="text-xs text-textSecondary">{b.description}</span>
              <span className="text-xs font-medium text-textSecondary">{criteriaLabel(b.criteria)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; points: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard()
      .then((res) => {
        setEntries(res.leaderboard);
        setMyRank(res.myRank);
      })
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (error) return <p className="py-8 text-center text-danger">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      {myRank && (
        <div className="rounded-lg bg-primaryTint p-3 text-center text-sm font-semibold text-onPrimaryTint">
          Your Rank: #{myRank.rank} · {myRank.points} points
        </div>
      )}
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div
            key={e.userId}
            className={`flex items-center gap-3 rounded-lg p-3 shadow-card ${
              e.userId === user?.id ? 'bg-primaryTint' : 'bg-surface'
            }`}
          >
            <span className="w-6 text-center font-bold text-textSecondary">{e.rank}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {(e.name ?? '?')[0]?.toUpperCase()}
            </span>
            <span className="flex-1 text-sm font-medium text-textPrimary">{e.name ?? 'Anonymous'}</span>
            <span className="font-bold text-secondary">{e.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}
