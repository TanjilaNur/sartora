import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../api/contact/contact.service', () => ({
  submitContact: jest.fn(),
  listContacts: jest.fn(),
  getContactById: jest.fn(),
  replyToContact: jest.fn(),
  updateContactStatus: jest.fn(),
  deleteContact: jest.fn(),
}));

jest.mock('../api/faq/faq.service', () => ({
  createFAQ: jest.fn(),
  listFAQs: jest.fn(),
  getFAQById: jest.fn(),
  updateFAQ: jest.fn(),
  deleteFAQ: jest.fn(),
  listFAQCategories: jest.fn(),
}));

import contactRoutes from '../api/contact/contact.routes';
import faqRoutes from '../api/faq/faq.routes';
import * as contactService from '../api/contact/contact.service';
import * as faqService from '../api/faq/faq.service';

process.env.JWT_SECRET = 'test-secret';

const MockContact = contactService as jest.Mocked<typeof contactService>;
const MockFAQ = faqService as jest.Mocked<typeof faqService>;

const app = express();
app.use(express.json());
app.use('/api/contact', contactRoutes);
app.use('/api/faq', faqRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const adminId = new mongoose.Types.ObjectId().toString();
const userId = new mongoose.Types.ObjectId().toString();
const contactId = new mongoose.Types.ObjectId().toString();
const faqId = new mongoose.Types.ObjectId().toString();

const adminToken = jwt.sign({ id: adminId, role: 'admin' }, 'test-secret', { expiresIn: '1h' });
const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });

function makeContact(overrides: Record<string, any> = {}) {
  return {
    _id: contactId,
    name: 'Alice',
    email: 'alice@example.com',
    subject: 'Order issue',
    message: 'My order has not arrived.',
    status: 'open',
    reply: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeFAQ(overrides: Record<string, any> = {}) {
  return {
    _id: faqId,
    question: 'What is your return policy?',
    answer: 'You can return within 30 days.',
    category: 'Returns',
    order: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Contact Tests ───────────────────────────────────────────────────────────

describe('POST /api/contact', () => {
  it('creates a contact submission (public)', async () => {
    MockContact.submitContact.mockResolvedValueOnce(makeContact() as any);
    const res = await request(app).post('/api/contact').send({
      name: 'Alice',
      email: 'alice@example.com',
      subject: 'Order issue',
      message: 'My order has not arrived.',
    });
    expect(res.status).toBe(201);
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.email).toBe('alice@example.com');
  });

  it('returns 400 when service throws bad request', async () => {
    const err = Object.assign(new Error('name is required'), { status: 400 });
    MockContact.submitContact.mockRejectedValueOnce(err);
    const res = await request(app).post('/api/contact').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('name is required');
  });
});

describe('GET /api/contact (admin)', () => {
  it('lists contacts for admin', async () => {
    MockContact.listContacts.mockResolvedValueOnce({
      contacts: [makeContact()],
      total: 1,
      page: 1,
      pages: 1,
    } as any);
    const res = await request(app)
      .get('/api/contact')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('rejects non-admin', async () => {
    const res = await request(app)
      .get('/api/contact')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated', async () => {
    const res = await request(app).get('/api/contact');
    expect(res.status).toBe(401);
  });

  it('filters by status query param', async () => {
    MockContact.listContacts.mockResolvedValueOnce({ contacts: [], total: 0, page: 1, pages: 0 } as any);
    const res = await request(app)
      .get('/api/contact?status=open')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(MockContact.listContacts).toHaveBeenCalledWith('open', 1, 20);
  });
});

describe('GET /api/contact/:contactId (admin)', () => {
  it('returns a single contact', async () => {
    MockContact.getContactById.mockResolvedValueOnce(makeContact() as any);
    const res = await request(app)
      .get(`/api/contact/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.contact._id).toBe(contactId);
  });

  it('returns 404 for missing contact', async () => {
    const err = Object.assign(new Error('Contact not found'), { status: 404 });
    MockContact.getContactById.mockRejectedValueOnce(err);
    const res = await request(app)
      .get(`/api/contact/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/contact/:contactId/reply (admin)', () => {
  it('admin replies and sets status resolved', async () => {
    MockContact.replyToContact.mockResolvedValueOnce(
      makeContact({ reply: 'We are shipping it now.', status: 'resolved' }) as any
    );
    const res = await request(app)
      .put(`/api/contact/${contactId}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reply: 'We are shipping it now.' });
    expect(res.status).toBe(200);
    expect(res.body.contact.status).toBe('resolved');
    expect(res.body.contact.reply).toBe('We are shipping it now.');
  });

  it('returns 400 when reply is empty', async () => {
    const err = Object.assign(new Error('reply is required'), { status: 400 });
    MockContact.replyToContact.mockRejectedValueOnce(err);
    const res = await request(app)
      .put(`/api/contact/${contactId}/reply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reply: '' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/contact/:contactId/status (admin)', () => {
  it('updates contact status', async () => {
    MockContact.updateContactStatus.mockResolvedValueOnce(
      makeContact({ status: 'closed' }) as any
    );
    const res = await request(app)
      .put(`/api/contact/${contactId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'closed' });
    expect(res.status).toBe(200);
    expect(res.body.contact.status).toBe('closed');
  });
});

describe('DELETE /api/contact/:contactId (admin)', () => {
  it('deletes a contact', async () => {
    MockContact.deleteContact.mockResolvedValueOnce(undefined);
    const res = await request(app)
      .delete(`/api/contact/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Contact deleted');
  });

  it('returns 404 when contact not found', async () => {
    const err = Object.assign(new Error('Contact not found'), { status: 404 });
    MockContact.deleteContact.mockRejectedValueOnce(err);
    const res = await request(app)
      .delete(`/api/contact/${contactId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ── FAQ Tests ───────────────────────────────────────────────────────────────

describe('GET /api/faq (public)', () => {
  it('lists active FAQs', async () => {
    MockFAQ.listFAQs.mockResolvedValueOnce([makeFAQ()] as any);
    const res = await request(app).get('/api/faq');
    expect(res.status).toBe(200);
    expect(res.body.faqs).toHaveLength(1);
  });

  it('passes category filter to service', async () => {
    MockFAQ.listFAQs.mockResolvedValueOnce([] as any);
    await request(app).get('/api/faq?category=Returns');
    expect(MockFAQ.listFAQs).toHaveBeenCalledWith('Returns', false);
  });
});

describe('GET /api/faq/categories (public)', () => {
  it('returns list of FAQ categories', async () => {
    MockFAQ.listFAQCategories.mockResolvedValueOnce(['General', 'Returns', 'Shipping']);
    const res = await request(app).get('/api/faq/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(['General', 'Returns', 'Shipping']);
  });
});

describe('GET /api/faq/:faqId (public)', () => {
  it('returns a single FAQ', async () => {
    MockFAQ.getFAQById.mockResolvedValueOnce(makeFAQ() as any);
    const res = await request(app).get(`/api/faq/${faqId}`);
    expect(res.status).toBe(200);
    expect(res.body.faq._id).toBe(faqId);
  });

  it('returns 404 for unknown FAQ', async () => {
    const err = Object.assign(new Error('FAQ not found'), { status: 404 });
    MockFAQ.getFAQById.mockRejectedValueOnce(err);
    const res = await request(app).get(`/api/faq/${faqId}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/faq (admin)', () => {
  it('creates a new FAQ', async () => {
    MockFAQ.createFAQ.mockResolvedValueOnce(makeFAQ() as any);
    const res = await request(app)
      .post('/api/faq')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: 'What is your return policy?', answer: 'You can return within 30 days.', category: 'Returns' });
    expect(res.status).toBe(201);
    expect(res.body.faq.question).toBe('What is your return policy?');
  });

  it('rejects non-admin', async () => {
    const res = await request(app)
      .post('/api/faq')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ question: 'Q?', answer: 'A.' });
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated', async () => {
    const res = await request(app).post('/api/faq').send({ question: 'Q?', answer: 'A.' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when service rejects empty question', async () => {
    const err = Object.assign(new Error('question is required'), { status: 400 });
    MockFAQ.createFAQ.mockRejectedValueOnce(err);
    const res = await request(app)
      .post('/api/faq')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: '', answer: 'A.' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/faq/admin/all (admin)', () => {
  it('lists all FAQs including inactive for admin', async () => {
    MockFAQ.listFAQs.mockResolvedValueOnce([makeFAQ(), makeFAQ({ active: false })] as any);
    const res = await request(app)
      .get('/api/faq/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.faqs).toHaveLength(2);
    expect(MockFAQ.listFAQs).toHaveBeenCalledWith(undefined, true);
  });

  it('rejects non-admin', async () => {
    const res = await request(app)
      .get('/api/faq/admin/all')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/faq/:faqId (admin)', () => {
  it('updates a FAQ', async () => {
    MockFAQ.updateFAQ.mockResolvedValueOnce(makeFAQ({ answer: 'Updated answer.' }) as any);
    const res = await request(app)
      .put(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ answer: 'Updated answer.' });
    expect(res.status).toBe(200);
    expect(res.body.faq.answer).toBe('Updated answer.');
  });

  it('returns 404 for unknown FAQ', async () => {
    const err = Object.assign(new Error('FAQ not found'), { status: 404 });
    MockFAQ.updateFAQ.mockRejectedValueOnce(err);
    const res = await request(app)
      .put(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ answer: 'X' });
    expect(res.status).toBe(404);
  });

  it('can toggle active status', async () => {
    MockFAQ.updateFAQ.mockResolvedValueOnce(makeFAQ({ active: false }) as any);
    const res = await request(app)
      .put(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.faq.active).toBe(false);
  });
});

describe('DELETE /api/faq/:faqId (admin)', () => {
  it('deletes a FAQ', async () => {
    MockFAQ.deleteFAQ.mockResolvedValueOnce(undefined);
    const res = await request(app)
      .delete(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('FAQ deleted');
  });

  it('returns 404 when FAQ not found', async () => {
    const err = Object.assign(new Error('FAQ not found'), { status: 404 });
    MockFAQ.deleteFAQ.mockRejectedValueOnce(err);
    const res = await request(app)
      .delete(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects non-admin', async () => {
    const res = await request(app)
      .delete(`/api/faq/${faqId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
