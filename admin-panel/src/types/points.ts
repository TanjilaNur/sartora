export type BadgeCriteriaType = 'points_threshold' | 'order_count' | 'review_count';

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  value: number;
}

export interface Badge {
  _id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
  createdAt: string;
  updatedAt: string;
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

export interface CreateBadgePayload {
  key: string;
  name: string;
  description: string;
  icon?: string;
  criteria: BadgeCriteria;
}

export type UpdateBadgePayload = Partial<Omit<CreateBadgePayload, 'key'>>;
