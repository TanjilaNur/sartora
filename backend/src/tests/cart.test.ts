import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cartRoutes from '../api/cart/cart.routes';
import orderRoutes from '../api/orders/order.routes';
import { Cart } from '../api/cart/cart.model';
import { Product } from '../api/products/product.model';
import { Order } from '../api/orders/order.model';

jest.mock('../api/cart/cart.model', () => ({
  Cart: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../api/products/product.model', () => ({
  Product: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../api/orders/order.model', () => ({
  Order: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));

const MockCart = Cart as jest.Mocked<typeof Cart>;
const MockProduct = Product as jest.Mocked<typeof Product>;
const MockOrder = Order as jest.Mocked<typeof Order>;

process.env.JWT_SECRET = 'test-secret';

const app = express();
app.use(express.json());
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const userId = new mongoose.Types.ObjectId().toString();
const prodId = new mongoose.Types.ObjectId().toString();
const orderId = new mongoose.Types.ObjectId().toString();

const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });

const address = { street: '123 Main St', city: 'Dhaka', state: 'Dhaka', zip: '1000', country: 'BD' };
const paymentDetails = { method: 'cash_on_delivery' };

function makeProduct(overrides: Record<string, any> = {}) {
  return {
    _id: prodId,
    name: 'Red Gown',
    price: 299.99,
    stock: 10,
    ...overrides,
  };
}

function makeCart(overrides: Record<string, any> = {}) {
  return {
    user: userId,
    items: [] as any[],
    ...overrides,
  };
}

function makeOrder(overrides: Record<string, any> = {}) {
  return {
    _id: orderId,
    user: userId,
    items: [{ product: prodId, name: 'Red Gown', price: 299.99, quantity: 2 }],
    total: 599.98,
    address,
    paymentDetails,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

// Wrapper for mocked query results: directly awaitable (thenable) AND
// supports the specific chained methods each call site actually uses
// (`.populate()`, `.lean()`, `.session()`, `.sort()`), all resolving to the
// same underlying value. Keeps each test's setup to one line regardless of
// which exact chain the real service code happens to use.
function queryResult<T>(doc: T) {
  const self: any = {
    lean: jest.fn().mockResolvedValue(doc),
    session: jest.fn(() => self),
    populate: jest.fn(() => self),
    sort: jest.fn(() => self),
    then: (resolve: (v: T) => void) => resolve(doc),
  };
  return self;
}

function makeFakeSession() {
  return {
    withTransaction: async (fn: () => Promise<any>) => fn(),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
}

// ── GET /api/cart ─────────────────────────────────────────────────────────────

describe('GET /api/cart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty cart for a user with no items', async () => {
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(null));

    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.cart.total).toBe(0);
  });

  it('returns cart with populated items and total', async () => {
    const cart = makeCart({ items: [{ product: makeProduct(), quantity: 2 }] });
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(cart));

    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.total).toBeCloseTo(599.98);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/cart/:productId ─────────────────────────────────────────────────

describe('POST /api/cart/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds an item to the cart', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue(queryResult(makeProduct()));
    (MockCart.findOneAndUpdate as jest.Mock).mockResolvedValue(
      makeCart({ items: [{ product: prodId, quantity: 2 }] })
    );
    (MockCart.findOne as jest.Mock).mockReturnValue(
      queryResult(makeCart({ items: [{ product: makeProduct(), quantity: 2 }] }))
    );

    const res = await request(app)
      .post(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(201);
  });

  it('returns 400 for out-of-stock product', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue(queryResult(makeProduct({ stock: 0 })));

    const res = await request(app)
      .post(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid quantity', async () => {
    const res = await request(app)
      .post(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: -1 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent product', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue(queryResult(null));

    const res = await request(app)
      .post(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post(`/api/cart/${prodId}`).send({ quantity: 1 });
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/cart/:productId ──────────────────────────────────────────────────

describe('PUT /api/cart/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates item quantity', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue(queryResult(makeProduct()));
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    (MockCart.findOne as jest.Mock).mockReturnValue(
      queryResult(makeCart({ items: [{ product: makeProduct(), quantity: 3 }] }))
    );

    const res = await request(app)
      .put(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
  });

  it('returns 400 if quantity missing', async () => {
    const res = await request(app)
      .put(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 404 if item not in cart', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue(queryResult(makeProduct()));
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

    const res = await request(app)
      .put(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/cart/:productId ───────────────────────────────────────────────

describe('DELETE /api/cart/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes an item from the cart', async () => {
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(makeCart()));

    const res = await request(app)
      .delete(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 if item not in cart', async () => {
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });

    const res = await request(app)
      .delete(`/api/cart/${prodId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/cart (clear) ──────────────────────────────────────────────────

describe('DELETE /api/cart', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the entire cart', async () => {
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cart cleared');
  });
});

// ── POST /api/orders (checkout) ───────────────────────────────────────────────

describe('POST /api/orders', () => {
  let sessionSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionSpy = jest.spyOn(mongoose, 'startSession').mockResolvedValue(makeFakeSession() as any);
  });

  afterEach(() => {
    sessionSpy.mockRestore();
  });

  it('places an order from cart', async () => {
    const cart = makeCart({ items: [{ product: makeProduct(), quantity: 2 }] });
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(cart));
    (MockProduct.findOneAndUpdate as jest.Mock).mockResolvedValue(makeProduct());
    (MockOrder.create as jest.Mock).mockResolvedValue([makeOrder()]);
    (MockCart.updateOne as jest.Mock).mockResolvedValue({ acknowledged: true });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address, paymentDetails });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('total');
    expect(res.body.items).toHaveLength(1);
  });

  it('returns 400 for empty cart', async () => {
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(makeCart({ items: [] })));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address, paymentDetails });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cart is empty');
  });

  it('returns 400 if address is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentDetails });

    expect(res.status).toBe(400);
  });

  it('returns 400 if paymentDetails is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address });

    expect(res.status).toBe(400);
  });

  it('returns 400 if address fields are incomplete', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address: { street: '123 Main St' }, paymentDetails });

    expect(res.status).toBe(400);
  });

  it('returns 400 when a cart item is out of stock (atomic reservation fails)', async () => {
    const cart = makeCart({ items: [{ product: makeProduct(), quantity: 5 }] });
    (MockCart.findOne as jest.Mock).mockReturnValue(queryResult(cart));
    (MockProduct.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address, paymentDetails });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/orders').send({ address, paymentDetails });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders ───────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns list of user orders', async () => {
    (MockOrder.find as jest.Mock).mockReturnValue(queryResult([makeOrder()]));

    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });

  it('returns empty array if no orders', async () => {
    (MockOrder.find as jest.Mock).mockReturnValue(queryResult([]));

    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders/:orderId ──────────────────────────────────────────────────

describe('GET /api/orders/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a single order', async () => {
    (MockOrder.findOne as jest.Mock).mockReturnValue(queryResult(makeOrder()));

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('pending');
  });

  it('returns 404 for unknown or other user order', async () => {
    (MockOrder.findOne as jest.Mock).mockReturnValue(queryResult(null));

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(401);
  });
});
