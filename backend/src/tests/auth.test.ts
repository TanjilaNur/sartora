import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authRoutes from '../api/auth/auth.routes';
import { User } from '../api/users/user.model';

// Mock mongoose and User model so tests run without a real DB
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return actual;
});

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

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers a new user and returns token', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);
    const user = makeUser();
    (MockUser.create as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '01711111111',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 409 if email already taken', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(makeUser());

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '01711111111',
    });

    expect(res.status).toBe(409);
  });

  it('returns 400 if password is too short', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      phone: '01711111111',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 if required fields missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in with correct credentials', async () => {
    const hashed = await bcrypt.hash('password123', 1);
    const user = makeUser({ password: hashed });
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('correctpass', 1);
    const user = makeUser({ password: hashed });
    (MockUser.findOne as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 401 for non-existent user (no info leak)', async () => {
    (MockUser.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a new access token for a valid refresh token', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const refreshToken = jwt.sign({ id: userId }, 'test-refresh-secret', { expiresIn: '7d' });
    const user = makeUser({ _id: userId, refreshToken });
    (MockUser.findById as jest.Mock).mockResolvedValue(user);

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bad.token.here' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('logs out an authenticated user', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const accessToken = jwt.sign({ id: userId, role: 'user' }, 'test-secret', { expiresIn: '1h' });
    (MockUser.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});
