export interface PointsLedgerEntry {
  _id: string;
  event: 'signup' | 'purchase' | 'review';
  points: number;
  description: string;
  createdAt: string;
}

export interface PointsHistoryResponse {
  entries: PointsLedgerEntry[];
  total: number;
  balance: number;
  page: number;
  pages: number;
}

export interface BadgeCriteria {
  type: 'points_threshold' | 'order_count' | 'review_count';
  value: number;
}

export interface Badge {
  _id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
}

export interface EarnedBadge {
  badge: Badge;
  earnedAt: string;
}

export interface MyBadgesResponse {
  earned: EarnedBadge[];
  locked: { badge: Badge }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name?: string;
  points: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  myRank?: { rank: number; points: number };
}
