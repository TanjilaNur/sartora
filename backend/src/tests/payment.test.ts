import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Mock payment.service before importing routes
jest.mock('../api/payments/payment.service', () => ({
  createPaymentIntent: jest.fn(),
  handleWebhookEvent: jest.fn(),
  refundOrder: jest.fn(),
  getTransactionByOrderId: jest.fn(),
}));

import paymentRoutes from '../api/payments/payment.routes';
import { stripeWebhook } from '../api/payments/payment.controller';
import * as paymentService from '../api/payments/payment.service';

process.env.JWT_SECRET = 'test-secret';

const MockService = paymentService as jest.Mocked<typeof paymentService>;

const userId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const orderId = new mongoose.Types.ObjectId().toString();

const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });
const adminToken = jwt.sign({ id: adminId, role: 'admin' }, 'test-secret', { expiresIn: '1h' });

const address = { street: '123 Main St', city: 'Dhaka', state: 'Dhaka', zip: '1000', country: 'BD' };

function makeTransaction(overrides: Record<string, any> = {}) {
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    order: orderId,
    user: userId,
    stripePaymentIntentId: 'pi_test_12345',
    amount: 59998,
    currency: 'usd',
    status: 'pending',
    idempotencyKey: `order-${orderId}-abc`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const app = express();

// Webhook needs raw body — register before json parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json());
app.use('/api/payments', paymentRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

// ── POST /api/payments/intent ─────────────────────────────────────────────────

describe('POST /api/payments/intent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a payment intent and returns clientSecret', async () => {
    MockService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_secret_abc',
      paymentIntentId: 'pi_test_12345',
      orderId,
      amount: 59998,
      currency: 'usd',
    });

    const res = await request(app)
      .post('/api/payments/intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('clientSecret');
    expect(res.body).toHaveProperty('paymentIntentId');
    expect(res.body).toHaveProperty('orderId');
    expect(res.body.amount).toBe(59998);
  });

  it('returns 400 when address is missing', async () => {
    const res = await request(app)
      .post('/api/payments/intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('address is required');
  });

  it('returns 400 when cart is empty', async () => {
    const err = Object.assign(new Error('Cart is empty'), { status: 400 });
    MockService.createPaymentIntent.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/payments/intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cart is empty');
  });

  it('returns 400 when address fields are incomplete', async () => {
    const err = Object.assign(
      new Error('address must include street, city, state, zip, and country'),
      { status: 400 }
    );
    MockService.createPaymentIntent.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/payments/intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ address: { street: '123 Main St' } });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/payments/intent').send({ address });
    expect(res.status).toBe(401);
  });
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────

describe('POST /api/payments/webhook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 and processes a valid webhook event', async () => {
    MockService.handleWebhookEvent.mockResolvedValue(undefined);

    const body = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-test-sig')
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(MockService.handleWebhookEvent).toHaveBeenCalledWith(
      expect.any(Buffer),
      'valid-test-sig'
    );
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('{}'));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing stripe-signature header');
  });

  it('returns 400 when signature verification fails', async () => {
    const err = Object.assign(new Error('Webhook signature verification failed'), { status: 400 });
    MockService.handleWebhookEvent.mockRejectedValue(err);

    const body = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Webhook signature verification failed');
  });
});

// ── POST /api/payments/refund/:orderId ────────────────────────────────────────

describe('POST /api/payments/refund/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows admin to refund a paid order', async () => {
    MockService.refundOrder.mockResolvedValue(
      makeTransaction({ status: 'refunded', stripeRefundId: 're_test_abc' }) as any
    );

    const res = await request(app)
      .post(`/api/payments/refund/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Refund initiated');
    expect(res.body.refundId).toBe('re_test_abc');
    expect(res.body.status).toBe('refunded');
  });

  it('returns 403 for non-admin user', async () => {
    const err = Object.assign(new Error('Admin access required'), { status: 403 });
    MockService.refundOrder.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/payments/refund/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when order not found', async () => {
    const err = Object.assign(new Error('Order not found'), { status: 404 });
    MockService.refundOrder.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/payments/refund/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 when order is not paid', async () => {
    const err = Object.assign(new Error('Order is not in a paid state'), { status: 400 });
    MockService.refundOrder.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/payments/refund/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Order is not in a paid state');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post(`/api/payments/refund/${orderId}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/payments/transaction/:orderId ────────────────────────────────────

describe('GET /api/payments/transaction/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns transaction details for the order owner', async () => {
    MockService.getTransactionByOrderId.mockResolvedValue(makeTransaction() as any);

    const res = await request(app)
      .get(`/api/payments/transaction/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transaction).toHaveProperty('stripePaymentIntentId', 'pi_test_12345');
    expect(res.body.transaction).toHaveProperty('amount', 59998);
    expect(res.body.transaction).toHaveProperty('status', 'pending');
    // Card data must NOT be present
    expect(res.body.transaction).not.toHaveProperty('cardNumber');
    expect(res.body.transaction).not.toHaveProperty('cvv');
  });

  it('returns 404 when transaction not found', async () => {
    const err = Object.assign(new Error('Transaction not found'), { status: 404 });
    MockService.getTransactionByOrderId.mockRejectedValue(err);

    const res = await request(app)
      .get(`/api/payments/transaction/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/payments/transaction/${orderId}`);
    expect(res.status).toBe(401);
  });
});
