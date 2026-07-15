import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

jest.mock('../api/preferences/preference.service', () => ({
  getPreference: jest.fn(),
  createPreference: jest.fn(),
  updatePreference: jest.fn(),
  resetPreference: jest.fn(),
  deletePreference: jest.fn(),
}));

import preferenceRoutes from '../api/preferences/preference.routes';
import * as prefService from '../api/preferences/preference.service';

process.env.JWT_SECRET = 'test-secret';

const MockPref = prefService as jest.Mocked<typeof prefService>;

const app = express();
app.use(express.json());
app.use('/api/preferences', preferenceRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const userId = new mongoose.Types.ObjectId().toString();
const userToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });

function makePref(overrides: Record<string, any> = {}) {
  return {
    _id: new mongoose.Types.ObjectId().toString(),
    user: userId,
    darkMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/preferences', () => {
  it('returns preference for authenticated user', async () => {
    const pref = makePref({ darkMode: false });
    MockPref.getPreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(false);
    expect(MockPref.getPreference).toHaveBeenCalledWith(userId);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/preferences');
    expect(res.status).toBe(401);
  });

  it('auto-creates preference if none exists (darkMode: false by default)', async () => {
    const pref = makePref({ darkMode: false });
    MockPref.getPreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(false);
  });
});

describe('POST /api/preferences', () => {
  it('creates preference with darkMode true', async () => {
    const pref = makePref({ darkMode: true });
    MockPref.createPreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: true });

    expect(res.status).toBe(201);
    expect(res.body.preference.darkMode).toBe(true);
    expect(MockPref.createPreference).toHaveBeenCalledWith(userId, true);
  });

  it('creates preference with darkMode false when not specified', async () => {
    const pref = makePref({ darkMode: false });
    MockPref.createPreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(MockPref.createPreference).toHaveBeenCalledWith(userId, false);
  });

  it('returns 409 if preference already exists', async () => {
    const err = new Error('Preference already exists; use PUT to update');
    (err as any).status = 409;
    MockPref.createPreference.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: true });

    expect(res.status).toBe(409);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/preferences').send({ darkMode: true });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/preferences', () => {
  it('updates darkMode to true', async () => {
    const pref = makePref({ darkMode: true });
    MockPref.updatePreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: true });

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(true);
    expect(MockPref.updatePreference).toHaveBeenCalledWith(userId, true);
  });

  it('updates darkMode to false', async () => {
    const pref = makePref({ darkMode: false });
    MockPref.updatePreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: false });

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(false);
  });

  it('returns 400 if darkMode is not boolean', async () => {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/boolean/i);
  });

  it('upserts preference if none exists', async () => {
    const pref = makePref({ darkMode: true });
    MockPref.updatePreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ darkMode: true });

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/preferences').send({ darkMode: true });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/preferences/reset', () => {
  it('resets darkMode to false', async () => {
    const pref = makePref({ darkMode: false });
    MockPref.resetPreference.mockResolvedValue(pref as any);

    const res = await request(app)
      .patch('/api/preferences/reset')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preference.darkMode).toBe(false);
    expect(res.body.message).toMatch(/reset/i);
    expect(MockPref.resetPreference).toHaveBeenCalledWith(userId);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/preferences/reset');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/preferences', () => {
  it('deletes preference for authenticated user', async () => {
    MockPref.deletePreference.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    expect(MockPref.deletePreference).toHaveBeenCalledWith(userId);
  });

  it('returns 404 if preference not found', async () => {
    const err = new Error('Preference not found');
    (err as any).status = 404;
    MockPref.deletePreference.mockRejectedValue(err);

    const res = await request(app)
      .delete('/api/preferences')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/preferences');
    expect(res.status).toBe(401);
  });
});
