import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import authRoutes from '../api/auth/auth.routes';
import { User } from '../api/users/user.model';

jest.mock('../api/users/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
  },
}));

const MockUser = User as jest.Mocked<typeof User>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const makeUser = (overrides: Record<string, any> = {}) => ({
  _id: new mongoose.Types.ObjectId().toString(),
  name: 'Test User',
  email: 'test@example.com',
  password: '',
  phone: '01711111111',
  role: 'user',
  refreshToken: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('POST /api/auth/phone-login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in with correct phone and password', async () => {
    const hashed = await bcrypt.hash('password123', 1);
    const user = makeUser({ password: hashed });
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/phone-login').send({
      phone: '01711111111',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.phone).toBe('01711111111');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('correctpass', 1);
    const user = makeUser({ password: hashed });
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/phone-login').send({
      phone: '01711111111',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 401 for non-existent phone (no info leak)', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/auth/phone-login').send({
      phone: '01999999999',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 400 if phone is missing', async () => {
    const res = await request(app).post('/api/auth/phone-login').send({
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('phone and password are required');
  });

  it('returns 400 if password is missing', async () => {
    const res = await request(app).post('/api/auth/phone-login').send({
      phone: '01711111111',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('phone and password are required');
  });

  it('returns 400 if both fields are missing', async () => {
    const res = await request(app).post('/api/auth/phone-login').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('phone and password are required');
  });

  it('looks up user by phone number', async () => {
    const hashed = await bcrypt.hash('password123', 1);
    const user = makeUser({ phone: '01833333333', password: hashed });
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);

    await request(app).post('/api/auth/phone-login').send({
      phone: '01833333333',
      password: 'password123',
    });

    // Deactivated accounts must be excluded from phone login the same way
    // they are from email login — see auth.service.ts::loginWithPhone.
    expect(MockUser.findOne).toHaveBeenCalledWith({ phone: '01833333333', isDeleted: { $ne: true } });
  });
});
