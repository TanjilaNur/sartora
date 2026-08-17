import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import guestRoutes from '../api/guest/guest_cart.routes';
import { GuestCart } from '../api/guest/guest_cart.model';
import { Product } from '../api/products/product.model';
import { Cart } from '../api/cart/cart.model';

jest.mock('../api/guest/guest_cart.model', () => ({
  GuestCart: {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    exists: jest.fn(),
  },
}));

jest.mock('../api/products/product.model', () => ({
  Product: {
    findById: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../api/cart/cart.model', () => ({
  Cart: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  },
}));

// mock the cart.service used in merge
jest.mock('../api/cart/cart.service', () => ({
  getCart: jest.fn().mockResolvedValue({ items: [], total: 0 }),
}));

const MockGuestCart = GuestCart as jest.Mocked<typeof GuestCart>;
const MockProduct = Product as jest.Mocked<typeof Product>;
const MockCart = Cart as jest.Mocked<typeof Cart>;

process.env.JWT_SECRET = 'test-secret';

const app = express();
app.use(express.json());
app.use('/api/guest', guestRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const guestId = 'test-guest-uuid-1234';
const prodId = new mongoose.Types.ObjectId().toString();
const userId = new mongoose.Types.ObjectId().toString();
const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });

function makeProduct(overrides: Record<string, any> = {}) {
  return {
    _id: { toString: () => prodId },
    name: 'Red Gown',
    price: 199.99,
    stock: 10,
    ...overrides,
  };
}

function makeGuestCart(overrides: Record<string, any> = {}) {
  return {
    guestId,
    items: [] as any[],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// The service now calls `.lean()` on some GuestCart/Product/Cart reads (fast
// display-only paths) but still awaits others directly (paths that mutate
// the fetched document via `.save()`). This wrapper supports both calling
// conventions on the same mocked return value: it's directly awaitable
// (thenable) AND exposes a `.lean()` that resolves to the same doc.
function queryResult<T>(doc: T) {
  return {
    ...(doc as any),
    lean: jest.fn().mockResolvedValue(doc),
    then: (resolve: (v: T) => void) => resolve(doc),
  };
}

// ── POST /api/guest/session ───────────────────────────────────────────────────

describe('POST /api/guest/session', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a new guest session and returns guestId', async () => {
    (MockGuestCart.create as jest.Mock).mockResolvedValue({ guestId });

    const res = await request(app).post('/api/guest/session');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('guestId');
    expect(typeof res.body.guestId).toBe('string');
  });
});

// ── GET /api/guest/cart/:guestId ──────────────────────────────────────────────

describe('GET /api/guest/cart/:guestId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty cart for a fresh session', async () => {
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(makeGuestCart()));
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([]));

    const res = await request(app).get(`/api/guest/cart/${guestId}`);

    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.cart.total).toBe(0);
  });

  it('returns cart with items and computed total', async () => {
    const cart = makeGuestCart({ items: [{ productId: prodId, quantity: 2 }] });
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(cart));
    const product = makeProduct();
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([product]));

    const res = await request(app).get(`/api/guest/cart/${guestId}`);

    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.total).toBeCloseTo(399.98);
  });

  it('returns 404 for unknown guestId', async () => {
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(null));

    const res = await request(app).get('/api/guest/cart/unknown-id');

    expect(res.status).toBe(404);
  });
});

// ── POST /api/guest/cart/:guestId/items ──────────────────────────────────────

describe('POST /api/guest/cart/:guestId/items', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds a new item to guest cart', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(makeProduct());
    // addToGuestCart itself upserts the line atomically via findOneAndUpdate,
    // then delegates to getGuestCart (a plain findOne().lean() read) for the
    // response — the two calls are mocked separately below.
    (MockGuestCart.findOneAndUpdate as jest.Mock).mockResolvedValue(
      makeGuestCart({ items: [{ productId: prodId, quantity: 1 }] })
    );
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(
      queryResult(makeGuestCart({ items: [{ productId: prodId, quantity: 1 }] }))
    );
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([makeProduct()]));

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ productId: prodId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('cart');
  });

  it('returns 400 when productId is missing', async () => {
    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('productId is required');
  });

  it('returns 400 for invalid quantity', async () => {
    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ productId: prodId, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for out-of-stock product', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(makeProduct({ stock: 0 }));
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(makeGuestCart()));

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ productId: prodId, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Insufficient stock');
  });

  it('returns 404 for non-existent product', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ productId: prodId, quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown guest session', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(makeProduct());
    (MockGuestCart.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/items`)
      .send({ productId: prodId, quantity: 1 });

    expect(res.status).toBe(404);
  });
});

// ── PUT /api/guest/cart/:guestId/items/:productId ────────────────────────────

describe('PUT /api/guest/cart/:guestId/items/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates item quantity', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(makeProduct());
    // A single positional $set is race-safe as one updateOne call — see the
    // comment on updateGuestCartItem in guest_cart.service.ts.
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(
      queryResult(makeGuestCart({ items: [{ productId: prodId, quantity: 3 }] }))
    );
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([makeProduct()]));

    const res = await request(app)
      .put(`/api/guest/cart/${guestId}/items/${prodId}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cart');
  });

  it('returns 400 when quantity is missing', async () => {
    const res = await request(app)
      .put(`/api/guest/cart/${guestId}/items/${prodId}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 if item not in guest cart', async () => {
    (MockProduct.findById as jest.Mock).mockResolvedValue(makeProduct());
    // matchedCount 0 on the item-scoped update sends the service down its
    // "does the session even exist" follow-up check — exists:true here means
    // the session is real but the item isn't in it, the case under test.
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
    (MockGuestCart.exists as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .put(`/api/guest/cart/${guestId}/items/${prodId}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/guest/cart/:guestId/items/:productId ─────────────────────────

describe('DELETE /api/guest/cart/:guestId/items/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes an item from guest cart', async () => {
    // removeFromGuestCart issues two updateOne calls (the $pull, then a
    // separate expiresAt bump) — both need to resolve, only the first
    // one's matchedCount/modifiedCount is actually inspected by the service.
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(makeGuestCart()));
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([]));

    const res = await request(app)
      .delete(`/api/guest/cart/${guestId}/items/${prodId}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 if item not in cart', async () => {
    // Session matched but $pull removed nothing -> modifiedCount 0.
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });

    const res = await request(app)
      .delete(`/api/guest/cart/${guestId}/items/${prodId}`);

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/guest/cart/:guestId ──────────────────────────────────────────

describe('DELETE /api/guest/cart/:guestId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the entire guest cart', async () => {
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

    const res = await request(app).delete(`/api/guest/cart/${guestId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest cart cleared');
  });

  it('returns 404 for unknown guest session', async () => {
    (MockGuestCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

    const res = await request(app).delete(`/api/guest/cart/unknown-id`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/guest/cart/:guestId/merge ──────────────────────────────────────

describe('POST /api/guest/cart/:guestId/merge', () => {
  beforeEach(() => jest.clearAllMocks());

  it('merges guest cart into user cart and deletes guest cart', async () => {
    const guestCartDoc = makeGuestCart({
      items: [{ productId: prodId, quantity: 2 }],
    });
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(guestCartDoc));
    (MockGuestCart.deleteOne as jest.Mock).mockResolvedValue({});

    const product = { _id: { toString: () => prodId }, price: 199.99, stock: 10 };
    (MockProduct.find as jest.Mock).mockReturnValue(queryResult([product]));

    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(null));
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/merge`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest cart merged');
    expect(res.body).toHaveProperty('cart');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post(`/api/guest/cart/${guestId}/merge`);

    expect(res.status).toBe(401);
  });

  it('returns merged cart even when guest cart is empty', async () => {
    (MockGuestCart.findOne as jest.Mock).mockReturnValue(queryResult(makeGuestCart({ items: [] })));

    const res = await request(app)
      .post(`/api/guest/cart/${guestId}/merge`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest cart merged');
  });
});
