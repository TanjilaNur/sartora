import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Mock services before importing routes
jest.mock('../api/orders/order.service', () => ({
  placeOrder: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderById: jest.fn(),
  cancelOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  getAllOrders: jest.fn(),
  getOrderInvoice: jest.fn(),
}));

jest.mock('../api/refunds/refund.service', () => ({
  createRefundRequest: jest.fn(),
  getUserRefundRequest: jest.fn(),
  listAllRefundRequests: jest.fn(),
  approveRefundRequest: jest.fn(),
  rejectRefundRequest: jest.fn(),
}));

import orderRoutes from '../api/orders/order.routes';
import refundRoutes from '../api/refunds/refund.routes';
import * as orderService from '../api/orders/order.service';
import * as refundService from '../api/refunds/refund.service';

process.env.JWT_SECRET = 'test-secret';

const MockOrder = orderService as jest.Mocked<typeof orderService>;
const MockRefund = refundService as jest.Mocked<typeof refundService>;

const userId = new mongoose.Types.ObjectId().toString();
const adminId = new mongoose.Types.ObjectId().toString();
const orderId = new mongoose.Types.ObjectId().toString();
const refundId = new mongoose.Types.ObjectId().toString();

const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });
const adminToken = jwt.sign({ id: adminId, role: 'admin' }, 'test-secret', { expiresIn: '1h' });

const address = { street: '123 Main St', city: 'Dhaka', state: 'Dhaka', zip: '1000', country: 'BD' };

function makeOrder(overrides: Record<string, any> = {}) {
  return {
    _id: orderId,
    user: userId,
    items: [{ product: new mongoose.Types.ObjectId().toString(), name: 'Red Gown', price: 299.99, quantity: 2 }],
    total: 599.98,
    address,
    paymentDetails: { method: 'cash_on_delivery' },
    paymentStatus: 'paid',
    status: 'pending',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    ...overrides,
  };
}

function makeRefundRequest(overrides: Record<string, any> = {}) {
  return {
    _id: refundId,
    order: orderId,
    user: userId,
    reason: 'Wrong size delivered',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeInvoice() {
  return {
    invoiceNumber: `INV-${orderId.slice(-8).toUpperCase()}`,
    issuedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    order: { id: orderId, status: 'pending', paymentStatus: 'paid', paymentMethod: 'cash_on_delivery' },
    customer: { id: userId },
    shippingAddress: address,
    lineItems: [{ name: 'Red Gown', unitPrice: 299.99, quantity: 2, subtotal: 599.98 }],
    subtotal: 599.98,
    total: 599.98,
  };
}

const app = express();
app.use(express.json());
app.use('/api/orders', orderRoutes);
app.use('/api/refunds', refundRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

// ── GET /api/orders ─────────────────────────────────────────────────────────

describe('GET /api/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the list of orders for the authenticated user', async () => {
    MockOrder.getUserOrders.mockResolvedValue([makeOrder()] as any);

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].total).toBe(599.98);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders/:orderId ─────────────────────────────────────────────────

describe('GET /api/orders/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the order for the owner', async () => {
    MockOrder.getOrderById.mockResolvedValue(makeOrder() as any);

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.order._id).toBe(orderId);
  });

  it('returns 404 when order not found', async () => {
    const err = Object.assign(new Error('Order not found'), { status: 404 });
    MockOrder.getOrderById.mockRejectedValue(err);

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/orders/:orderId/cancel ─────────────────────────────────────────

describe('POST /api/orders/:orderId/cancel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels a pending order and returns updated order', async () => {
    MockOrder.cancelOrder.mockResolvedValue(makeOrder({ status: 'cancelled' }) as any);

    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order cancelled');
    expect(res.body.order.status).toBe('cancelled');
  });

  it('returns 400 when order is not pending', async () => {
    const err = Object.assign(new Error('Only pending orders can be cancelled'), { status: 400 });
    MockOrder.cancelOrder.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only pending orders can be cancelled');
  });

  it('returns 404 when order not found', async () => {
    const err = Object.assign(new Error('Order not found'), { status: 404 });
    MockOrder.cancelOrder.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post(`/api/orders/${orderId}/cancel`);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/orders/:orderId/status ──────────────────────────────────────────

describe('PUT /api/orders/:orderId/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows admin to update order status to shipped', async () => {
    MockOrder.updateOrderStatus.mockResolvedValue(makeOrder({ status: 'shipped' }) as any);

    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order status updated');
    expect(res.body.order.status).toBe('shipped');
  });

  it('returns 400 when status field is missing', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('status is required');
  });

  it('returns 400 when status value is invalid', async () => {
    const err = Object.assign(
      new Error('status must be one of: pending, processing, shipped, delivered, cancelled'),
      { status: 400 }
    );
    MockOrder.updateOrderStatus.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'flying' });

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'shipped' });

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .send({ status: 'shipped' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders/admin/all ────────────────────────────────────────────────

describe('GET /api/orders/admin/all', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated list of all orders for admin', async () => {
    MockOrder.getAllOrders.mockResolvedValue({
      orders: [makeOrder()],
      total: 1,
      page: 1,
      pages: 1,
    } as any);

    const res = await request(app)
      .get('/api/orders/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.pages).toBe(1);
  });

  it('passes page and limit query params to service', async () => {
    MockOrder.getAllOrders.mockResolvedValue({ orders: [], total: 0, page: 2, pages: 0 } as any);

    await request(app)
      .get('/api/orders/admin/all?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(MockOrder.getAllOrders).toHaveBeenCalledWith(2, 5);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/orders/admin/all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/admin/all');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/orders/:orderId/invoice ─────────────────────────────────────────

describe('GET /api/orders/:orderId/invoice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns invoice for the order owner', async () => {
    MockOrder.getOrderInvoice.mockResolvedValue(makeInvoice() as any);

    const res = await request(app)
      .get(`/api/orders/${orderId}/invoice`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invoice).toHaveProperty('invoiceNumber');
    expect(res.body.invoice).toHaveProperty('lineItems');
    expect(res.body.invoice.lineItems[0].name).toBe('Red Gown');
    expect(res.body.invoice.total).toBe(599.98);
  });

  it('returns invoice for admin on any order', async () => {
    MockOrder.getOrderInvoice.mockResolvedValue(makeInvoice() as any);

    const res = await request(app)
      .get(`/api/orders/${orderId}/invoice`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invoice).toHaveProperty('shippingAddress');
  });

  it('returns 404 when order not found', async () => {
    const err = Object.assign(new Error('Order not found'), { status: 404 });
    MockOrder.getOrderInvoice.mockRejectedValue(err);

    const res = await request(app)
      .get(`/api/orders/${orderId}/invoice`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/orders/${orderId}/invoice`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/refunds/:orderId ────────────────────────────────────────────────

describe('POST /api/refunds/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a refund request for a paid order', async () => {
    MockRefund.createRefundRequest.mockResolvedValue(makeRefundRequest() as any);

    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Wrong size delivered' });

    expect(res.status).toBe(201);
    expect(res.body.refund.reason).toBe('Wrong size delivered');
    expect(res.body.refund.status).toBe('pending');
  });

  it('returns 400 when reason is missing', async () => {
    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('reason is required');
  });

  it('returns 400 when order is already refunded', async () => {
    const err = Object.assign(new Error('Order has already been refunded'), { status: 400 });
    MockRefund.createRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Duplicate' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Order has already been refunded');
  });

  it('returns 400 when a refund request already exists', async () => {
    const err = Object.assign(new Error('A refund request already exists for this order'), { status: 400 });
    MockRefund.createRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Not as described' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when order not found', async () => {
    const err = Object.assign(new Error('Order not found'), { status: 404 });
    MockRefund.createRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Not found' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/refunds/${orderId}`)
      .send({ reason: 'test' });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/refunds/my/:orderId ──────────────────────────────────────────────

describe('GET /api/refunds/my/:orderId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns refund request for the order owner', async () => {
    MockRefund.getUserRefundRequest.mockResolvedValue(makeRefundRequest() as any);

    const res = await request(app)
      .get(`/api/refunds/my/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.refund.status).toBe('pending');
    expect(res.body.refund.reason).toBe('Wrong size delivered');
  });

  it('returns 404 when no refund request exists', async () => {
    const err = Object.assign(new Error('Refund request not found'), { status: 404 });
    MockRefund.getUserRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .get(`/api/refunds/my/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Refund request not found');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/api/refunds/my/${orderId}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/refunds ─────────────────────────────────────────────────────────

describe('GET /api/refunds (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all refund requests for admin', async () => {
    MockRefund.listAllRefundRequests.mockResolvedValue([makeRefundRequest()] as any);

    const res = await request(app)
      .get('/api/refunds')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.refunds).toHaveLength(1);
    expect(res.body.refunds[0].reason).toBe('Wrong size delivered');
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/refunds')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/refunds');
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/refunds/:refundId/approve ────────────────────────────────────────

describe('PUT /api/refunds/:refundId/approve', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows admin to approve a pending refund request', async () => {
    MockRefund.approveRefundRequest.mockResolvedValue(
      makeRefundRequest({ status: 'approved' }) as any
    );

    const res = await request(app)
      .put(`/api/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Refund request approved');
    expect(res.body.refund.status).toBe('approved');
  });

  it('returns 400 when refund is already processed', async () => {
    const err = Object.assign(new Error('Only pending refund requests can be approved'), { status: 400 });
    MockRefund.approveRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only pending refund requests can be approved');
  });

  it('returns 404 when refund request not found', async () => {
    const err = Object.assign(new Error('Refund request not found'), { status: 404 });
    MockRefund.approveRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .put(`/api/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put(`/api/refunds/${refundId}/approve`);
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/refunds/:refundId/reject ─────────────────────────────────────────

describe('PUT /api/refunds/:refundId/reject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('allows admin to reject a pending refund request with a note', async () => {
    MockRefund.rejectRefundRequest.mockResolvedValue(
      makeRefundRequest({ status: 'rejected', adminNote: 'Outside return window' }) as any
    );

    const res = await request(app)
      .put(`/api/refunds/${refundId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNote: 'Outside return window' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Refund request rejected');
    expect(res.body.refund.status).toBe('rejected');
    expect(res.body.refund.adminNote).toBe('Outside return window');
  });

  it('allows rejection without an admin note', async () => {
    MockRefund.rejectRefundRequest.mockResolvedValue(
      makeRefundRequest({ status: 'rejected' }) as any
    );

    const res = await request(app)
      .put(`/api/refunds/${refundId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.refund.status).toBe('rejected');
  });

  it('returns 400 when refund is already processed', async () => {
    const err = Object.assign(new Error('Only pending refund requests can be rejected'), { status: 400 });
    MockRefund.rejectRefundRequest.mockRejectedValue(err);

    const res = await request(app)
      .put(`/api/refunds/${refundId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin user', async () => {
    const res = await request(app)
      .put(`/api/refunds/${refundId}/reject`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put(`/api/refunds/${refundId}/reject`).send({});
    expect(res.status).toBe(401);
  });
});
