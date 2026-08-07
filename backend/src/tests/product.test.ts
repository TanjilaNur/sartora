import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import productRoutes from '../api/products/product.routes';
import categoryRoutes from '../api/categories/category.routes';
import { Product } from '../api/products/product.model';
import { Category } from '../api/categories/category.model';

jest.mock('../api/products/product.model', () => ({
  Product: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../api/categories/category.model', () => ({
  Category: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

const MockProduct = Product as jest.Mocked<typeof Product>;
const MockCategory = Category as jest.Mocked<typeof Category>;

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({ message: err.message });
});

const adminToken = jwt.sign({ id: 'admin-id', role: 'admin' }, 'test-secret', { expiresIn: '1h' });
const userToken = jwt.sign({ id: 'user-id', role: 'user' }, 'test-secret', { expiresIn: '1h' });

const catId = new mongoose.Types.ObjectId().toString();
const prodId = new mongoose.Types.ObjectId().toString();

const makeCategory = (overrides: Record<string, any> = {}) => ({
  _id: catId,
  name: 'Evening Dresses',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeProduct = (overrides: Record<string, any> = {}) => ({
  _id: prodId,
  name: 'Red Gown',
  description: 'A beautiful red gown',
  category: { _id: catId, name: 'Evening Dresses' },
  price: 299.99,
  stock: 10,
  imageUrl: '',
  populate: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
  ...overrides,
});

// ── Category Tests ────────────────────────────────────────────────────────────

describe('GET /api/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all categories', async () => {
    (MockCategory.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([makeCategory()]),
      }),
    });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].name).toBe('Evening Dresses');
  });
});

describe('POST /api/categories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a category when admin', async () => {
    (MockCategory.findOne as jest.Mock).mockResolvedValue(null);
    (MockCategory.create as jest.Mock).mockResolvedValue(makeCategory());

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Evening Dresses' });

    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe('Evening Dresses');
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test' });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 409 when category already exists', async () => {
    (MockCategory.findOne as jest.Mock).mockResolvedValue(makeCategory());

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Evening Dresses' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/categories/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates a category', async () => {
    (MockCategory.findByIdAndUpdate as jest.Mock).mockResolvedValue(makeCategory({ name: 'Renamed' }));

    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe('Renamed');
  });

  it('returns 404 if not found', async () => {
    (MockCategory.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/categories/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a category', async () => {
    const cat = { ...makeCategory(), deleteOne: jest.fn().mockResolvedValue(undefined) };
    (MockCategory.findById as jest.Mock).mockResolvedValue(cat);
    (MockProduct.countDocuments as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category deleted');
  });

  it('returns 404 if not found', async () => {
    (MockCategory.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 409 when category has active products', async () => {
    const cat = { ...makeCategory(), deleteOne: jest.fn() };
    (MockCategory.findById as jest.Mock).mockResolvedValue(cat);
    (MockProduct.countDocuments as jest.Mock).mockResolvedValue(3);

    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
  });
});

// ── Product Tests ─────────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated products', async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([makeProduct()]),
    };
    (MockProduct.find as jest.Mock).mockReturnValue(mockQuery);
    (MockProduct.countDocuments as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
  });
});

describe('GET /api/products/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a single product', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(makeProduct()),
      }),
    });

    const res = await request(app).get(`/api/products/${prodId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Red Gown');
  });

  it('returns 404 for unknown product', async () => {
    (MockProduct.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const res = await request(app).get(`/api/products/${prodId}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a product when admin', async () => {
    (MockCategory.findById as jest.Mock).mockResolvedValue(makeCategory());
    const prod = makeProduct();
    (MockProduct.create as jest.Mock).mockResolvedValue(prod);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Red Gown', category: catId, price: 299.99, stock: 10 });

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Red Gown');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when category does not exist', async () => {
    (MockCategory.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', category: catId, price: 10, stock: 5 });

    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test', category: catId, price: 10, stock: 5 });
    expect(res.status).toBe(403);
  });

  it('returns 400 for negative price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test', category: catId, price: -5, stock: 5 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates a product', async () => {
    (MockCategory.findById as jest.Mock).mockResolvedValue(makeCategory());
    (MockProduct.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(makeProduct({ price: 399.99 })),
    });

    const res = await request(app)
      .put(`/api/products/${prodId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 399.99 });

    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown product', async () => {
    (MockProduct.findByIdAndUpdate as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .put(`/api/products/${prodId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 100 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:productId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes a product', async () => {
    (MockProduct.findByIdAndDelete as jest.Mock).mockResolvedValue(makeProduct());

    const res = await request(app)
      .delete(`/api/products/${prodId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Product deleted');
  });

  it('returns 404 for unknown product', async () => {
    (MockProduct.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/products/${prodId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
