import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../api/reviews/review.service', () => ({
  createReview: jest.fn(),
  getProductReviews: jest.fn(),
  getUserReviews: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  reportReview: jest.fn(),
  getReportedReviews: jest.fn(),
}));

jest.mock('../api/promotions/promotion.service', () => ({
  createPromotion: jest.fn(),
  listPromotions: jest.fn(),
  getPromotionById: jest.fn(),
  updatePromotion: jest.fn(),
  deletePromotion: jest.fn(),
  validatePromoCode: jest.fn(),
  applyPromoCode: jest.fn(),
}));

import reviewRoutes from '../api/reviews/review.routes';
import promotionRoutes from '../api/promotions/promotion.routes';
import * as reviewService from '../api/reviews/review.service';
import * as promotionService from '../api/promotions/promotion.service';

process.env.JWT_SECRET = 'test-secret';

const MockReview = reviewService as jest.Mocked<typeof reviewService>;
const MockPromotion = promotionService as jest.Mocked<typeof promotionService>;

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const userId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const productId = new mongoose.Types.ObjectId().toString();
const reviewId = new mongoose.Types.ObjectId().toString();
const promoId = new mongoose.Types.ObjectId().toString();

const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });
const adminToken = jwt.sign({ id: adminId, role: 'admin' }, 'test-secret', { expiresIn: '1h' });

function makeReview(overrides: Record<string, any> = {}) {
  return {
    _id: reviewId,
    user: userId,
    product: productId,
    rating: 4,
    text: 'Great dress!',
    verified: false,
    reported: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePromotion(overrides: Record<string, any> = {}) {
  return {
    _id: promoId,
    code: 'SAVE10',
    type: 'percent',
    value: 10,
    minOrderAmount: 0,
    maxUses: 100,
    usedCount: 0,
    perUserLimit: 1,
    active: true,
    usedBy: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Review Tests ──────────────────────────────────────────────────────────────

describe('POST /api/reviews/product/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a review when authenticated', async () => {
    MockReview.createReview.mockResolvedValue(makeReview() as any);

    const res = await request(app)
      .post(`/api/reviews/product/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 4, text: 'Great dress!' });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(4);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/reviews/product/${productId}`)
      .send({ rating: 4, text: 'Nice' });
    expect(res.status).toBe(401);
  });

  it('returns 409 if already reviewed', async () => {
    const err = new Error('You have already reviewed this product') as any;
    err.status = 409;
    MockReview.createReview.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/reviews/product/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, text: 'Love it' });

    expect(res.status).toBe(409);
  });

  it('returns 404 if product not found', async () => {
    const err = new Error('Product not found') as any;
    err.status = 404;
    MockReview.createReview.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/reviews/product/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 3, text: 'Okay' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/reviews/product/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns reviews for a product (public)', async () => {
    MockReview.getProductReviews.mockResolvedValue({
      reviews: [makeReview()],
      total: 1,
      page: 1,
      pages: 1,
      averageRating: 4,
    } as any);

    const res = await request(app).get(`/api/reviews/product/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.averageRating).toBe(4);
  });
});

describe('GET /api/reviews/my', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the authenticated user reviews', async () => {
    MockReview.getUserReviews.mockResolvedValue([makeReview()] as any);

    const res = await request(app)
      .get('/api/reviews/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/reviews/my');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/reviews/:reviewId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates own review', async () => {
    MockReview.updateReview.mockResolvedValue(makeReview({ rating: 5, text: 'Excellent!' }) as any);

    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 5, text: 'Excellent!' });

    expect(res.status).toBe(200);
    expect(res.body.review.rating).toBe(5);
  });

  it('returns 403 when editing another user review', async () => {
    const err = new Error('You can only edit your own reviews') as any;
    err.status = 403;
    MockReview.updateReview.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 1 });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/reviews/:reviewId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes own review', async () => {
    MockReview.deleteReview.mockResolvedValue(undefined as any);

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Review deleted');
  });

  it('admin can delete any review', async () => {
    MockReview.deleteReview.mockResolvedValue(undefined as any);

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown review', async () => {
    const err = new Error('Review not found') as any;
    err.status = 404;
    MockReview.deleteReview.mockRejectedValue(err);

    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/reviews/:reviewId/report', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports a review', async () => {
    MockReview.reportReview.mockResolvedValue(makeReview({ reported: true }) as any);

    const res = await request(app)
      .post(`/api/reviews/${reviewId}/report`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Review reported');
  });
});

describe('GET /api/reviews/admin/reported', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns reported reviews for admin', async () => {
    MockReview.getReportedReviews.mockResolvedValue([makeReview({ reported: true })] as any);

    const res = await request(app)
      .get('/api/reviews/admin/reported')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/reviews/admin/reported')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ── Promotion Tests ───────────────────────────────────────────────────────────

describe('POST /api/promotions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a promotion when admin', async () => {
    MockPromotion.createPromotion.mockResolvedValue(makePromotion() as any);

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'SAVE10', type: 'percent', value: 10 });

    expect(res.status).toBe(201);
    expect(res.body.promotion.code).toBe('SAVE10');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'SAVE10', type: 'percent', value: 10 });
    expect(res.status).toBe(403);
  });

  it('returns 409 when code already exists', async () => {
    const err = new Error('Promo code already exists') as any;
    err.status = 409;
    MockPromotion.createPromotion.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/promotions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'SAVE10', type: 'percent', value: 10 });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/promotions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists promotions for admin', async () => {
    MockPromotion.listPromotions.mockResolvedValue([makePromotion()] as any);

    const res = await request(app)
      .get('/api/promotions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.promotions).toHaveLength(1);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/promotions')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/promotions/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a single promotion', async () => {
    MockPromotion.getPromotionById.mockResolvedValue(makePromotion() as any);

    const res = await request(app)
      .get(`/api/promotions/${promoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.promotion.code).toBe('SAVE10');
  });

  it('returns 404 for unknown promotion', async () => {
    const err = new Error('Promotion not found') as any;
    err.status = 404;
    MockPromotion.getPromotionById.mockRejectedValue(err);

    const res = await request(app)
      .get(`/api/promotions/${promoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/promotions/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates a promotion', async () => {
    MockPromotion.updatePromotion.mockResolvedValue(makePromotion({ active: false }) as any);

    const res = await request(app)
      .put(`/api/promotions/${promoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });

    expect(res.status).toBe(200);
    expect(res.body.promotion.active).toBe(false);
  });
});

describe('DELETE /api/promotions/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a promotion', async () => {
    MockPromotion.deletePromotion.mockResolvedValue(undefined as any);

    const res = await request(app)
      .delete(`/api/promotions/${promoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Promotion deleted');
  });

  it('returns 404 for unknown promotion', async () => {
    const err = new Error('Promotion not found') as any;
    err.status = 404;
    MockPromotion.deletePromotion.mockRejectedValue(err);

    const res = await request(app)
      .delete(`/api/promotions/${promoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/promotions/validate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('validates a promo code', async () => {
    MockPromotion.validatePromoCode.mockResolvedValue({
      valid: true,
      discount: 30,
      finalTotal: 270,
      promoCode: 'SAVE10',
      type: 'percent',
      value: 10,
    } as any);

    const res = await request(app)
      .post('/api/promotions/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'SAVE10', orderTotal: 300 });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount).toBe(30);
    expect(res.body.finalTotal).toBe(270);
  });

  it('returns 400 for expired/invalid promo', async () => {
    const err = new Error('Promo code has expired') as any;
    err.status = 400;
    MockPromotion.validatePromoCode.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/promotions/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'OLD10', orderTotal: 100 });

    expect(res.status).toBe(400);
  });

  it('returns 400 when orderTotal is missing', async () => {
    const res = await request(app)
      .post('/api/promotions/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'SAVE10' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/promotions/validate')
      .send({ code: 'SAVE10', orderTotal: 100 });
    expect(res.status).toBe(401);
  });
});
