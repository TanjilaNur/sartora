import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../api/points/points.service', () => ({
  getUserPointsHistory: jest.fn(),
  getLeaderboard: jest.fn(),
  getUserBadges: jest.fn(),
  listBadges: jest.fn(),
  createBadge: jest.fn(),
  updateBadge: jest.fn(),
  deleteBadge: jest.fn(),
  awardPoints: jest.fn(),
  checkAndAwardBadges: jest.fn(),
  getUserPointsBalance: jest.fn(),
}));

import pointsRoutes from '../api/points/points.routes';
import badgeRoutes from '../api/points/badge.routes';
import * as pointsService from '../api/points/points.service';

process.env.JWT_SECRET = 'test-secret';

const MockPoints = pointsService as jest.Mocked<typeof pointsService>;

const app = express();
app.use(express.json());
app.use('/api/points', pointsRoutes);
app.use('/api/badges', badgeRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const userId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const badgeId = new mongoose.Types.ObjectId().toString();

const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });
const adminToken = jwt.sign({ id: adminId, role: 'admin' }, 'test-secret', { expiresIn: '1h' });

function makeLedgerEntry(overrides: Record<string, any> = {}) {
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    user: userId,
    event: 'signup',
    points: 50,
    description: 'Earned 50 points for signup',
    idempotencyKey: `signup:${userId}`,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeBadge(overrides: Record<string, any> = {}) {
  return {
    _id: badgeId,
    key: 'first_purchase',
    name: 'First Purchase',
    description: 'Made your first purchase',
    icon: '',
    criteria: { type: 'order_count', value: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Points Tests ──────────────────────────────────────────────────────────────

describe('GET /api/points/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns points history for authenticated user', async () => {
    MockPoints.getUserPointsHistory.mockResolvedValue({
      entries: [makeLedgerEntry()],
      total: 1,
      balance: 50,
      page: 1,
      pages: 1,
    } as any);

    const res = await request(app)
      .get('/api/points/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.balance).toBe(50);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].event).toBe('signup');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/points/me');
    expect(res.status).toBe(401);
  });

  it('supports pagination', async () => {
    MockPoints.getUserPointsHistory.mockResolvedValue({
      entries: [],
      total: 0,
      balance: 50,
      page: 2,
      pages: 1,
    } as any);

    const res = await request(app)
      .get('/api/points/me?page=2&limit=5')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(MockPoints.getUserPointsHistory).toHaveBeenCalledWith(userId, 2, 5);
  });
});

describe('GET /api/points/leaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns leaderboard with current user rank', async () => {
    MockPoints.getLeaderboard.mockResolvedValue({
      leaderboard: [
        { rank: 1, userId: adminId, name: 'Admin', points: 200 },
        { rank: 2, userId: userId, name: 'User', points: 50 },
      ],
      myRank: { rank: 2, points: 50 },
    } as any);

    const res = await request(app)
      .get('/api/points/leaderboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.leaderboard).toHaveLength(2);
    expect(res.body.leaderboard[0].rank).toBe(1);
    expect(res.body.myRank.rank).toBe(2);
    expect(res.body.myRank.points).toBe(50);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/points/leaderboard');
    expect(res.status).toBe(401);
  });

  it('passes limit param to service (capped at 100)', async () => {
    MockPoints.getLeaderboard.mockResolvedValue({ leaderboard: [], myRank: undefined } as any);

    await request(app)
      .get('/api/points/leaderboard?limit=50')
      .set('Authorization', `Bearer ${userToken}`);

    expect(MockPoints.getLeaderboard).toHaveBeenCalledWith(50, userId);
  });

  it('caps limit at 100', async () => {
    MockPoints.getLeaderboard.mockResolvedValue({ leaderboard: [], myRank: undefined } as any);

    await request(app)
      .get('/api/points/leaderboard?limit=9999')
      .set('Authorization', `Bearer ${userToken}`);

    expect(MockPoints.getLeaderboard).toHaveBeenCalledWith(100, userId);
  });
});

// ── Badge Tests ───────────────────────────────────────────────────────────────

describe('GET /api/badges', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all badge definitions without auth', async () => {
    MockPoints.listBadges.mockResolvedValue([makeBadge()] as any);

    const res = await request(app).get('/api/badges');

    expect(res.status).toBe(200);
    expect(res.body.badges).toHaveLength(1);
    expect(res.body.badges[0].key).toBe('first_purchase');
  });

  it('returns empty array when no badges exist', async () => {
    MockPoints.listBadges.mockResolvedValue([] as any);

    const res = await request(app).get('/api/badges');

    expect(res.status).toBe(200);
    expect(res.body.badges).toHaveLength(0);
  });
});

describe('GET /api/badges/my', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns earned and locked badges for authenticated user', async () => {
    MockPoints.getUserBadges.mockResolvedValue({
      earned: [{ badge: makeBadge(), earnedAt: new Date() }],
      locked: [{ badge: makeBadge({ key: 'loyal_customer', name: 'Loyal Customer', criteria: { type: 'points_threshold', value: 500 } }) }],
    } as any);

    const res = await request(app)
      .get('/api/badges/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.earned).toHaveLength(1);
    expect(res.body.locked).toHaveLength(1);
    expect(res.body.earned[0].badge.key).toBe('first_purchase');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/badges/my');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/badges', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a badge when admin', async () => {
    MockPoints.createBadge.mockResolvedValue(makeBadge() as any);

    const res = await request(app)
      .post('/api/badges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        key: 'first_purchase',
        name: 'First Purchase',
        description: 'Made your first purchase',
        criteria: { type: 'order_count', value: 1 },
      });

    expect(res.status).toBe(201);
    expect(res.body.badge.key).toBe('first_purchase');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/badges')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ key: 'test', name: 'Test', description: 'Test badge', criteria: { type: 'order_count', value: 1 } });

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/badges')
      .send({ key: 'test', name: 'Test', description: 'Test badge', criteria: { type: 'order_count', value: 1 } });

    expect(res.status).toBe(401);
  });

  it('returns 409 when badge key already exists', async () => {
    const err = new Error('Badge key already exists') as any;
    err.status = 409;
    MockPoints.createBadge.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/badges')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: 'first_purchase', name: 'First Purchase', description: 'Test', criteria: { type: 'order_count', value: 1 } });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/badges/:badgeId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates a badge', async () => {
    MockPoints.updateBadge.mockResolvedValue(makeBadge({ name: 'Updated Name' }) as any);

    const res = await request(app)
      .put(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.badge.name).toBe('Updated Name');
  });

  it('returns 404 for unknown badge', async () => {
    const err = new Error('Badge not found') as any;
    err.status = 404;
    MockPoints.updateBadge.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' });

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .put(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/badges/:badgeId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a badge', async () => {
    MockPoints.deleteBadge.mockResolvedValue(undefined as any);

    const res = await request(app)
      .delete(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Badge deleted');
  });

  it('returns 404 for unknown badge', async () => {
    const err = new Error('Badge not found') as any;
    err.status = 404;
    MockPoints.deleteBadge.mockRejectedValue(err);

    const res = await request(app)
      .delete(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .delete(`/api/badges/${badgeId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/badges/${badgeId}`);
    expect(res.status).toBe(401);
  });
});
