import { Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsCsv,
  importProductsCsv,
} from './product.service';

interface VariantBody {
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
}

function validateVariants(variants: unknown): variants is VariantBody[] {
  if (!Array.isArray(variants)) return false;
  return variants.every(
    (v: any) =>
      v &&
      typeof v === 'object' &&
      (typeof v.size === 'string' || v.size === undefined) &&
      (typeof v.color === 'string' || v.color === undefined) &&
      (v.size || v.color) &&
      typeof v.stock === 'number' &&
      v.stock >= 0 &&
      Number.isInteger(v.stock) &&
      (v.priceOverride === undefined || (typeof v.priceOverride === 'number' && v.priceOverride >= 0))
  );
}

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, search, page, limit } = req.query as Record<string, string>;
    const result = await getProducts({
      category,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await getProductById(req.params.productId as string);
    res.json({ product });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function addProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, category, price, stock, images, variants } = req.body as {
      name: string;
      description?: string;
      category: string;
      price: number;
      stock: number;
      images?: string[];
      variants?: VariantBody[];
    };

    if (!name || !category || price === undefined || stock === undefined) {
      res.status(400).json({ message: 'name, category, price, and stock are required' });
      return;
    }
    if (typeof price !== 'number' || price < 0) {
      res.status(400).json({ message: 'price must be a non-negative number' });
      return;
    }
    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      res.status(400).json({ message: 'stock must be a non-negative integer' });
      return;
    }
    if (images !== undefined && (!Array.isArray(images) || !images.every((i) => typeof i === 'string'))) {
      res.status(400).json({ message: 'images must be an array of URLs' });
      return;
    }
    if (variants !== undefined && !validateVariants(variants)) {
      res.status(400).json({
        message: 'each variant needs a non-negative integer stock and at least one of size/color',
      });
      return;
    }

    const product = await createProduct({ name, description, category, price, stock, images, variants });
    res.status(201).json({ product });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function editProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.productId as string;
    const { name, description, category, price, stock, images, variants } = req.body as {
      name?: string;
      description?: string;
      category?: string;
      price?: number;
      stock?: number;
      images?: string[];
      variants?: VariantBody[];
    };

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      res.status(400).json({ message: 'price must be a non-negative number' });
      return;
    }
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock))) {
      res.status(400).json({ message: 'stock must be a non-negative integer' });
      return;
    }
    if (images !== undefined && (!Array.isArray(images) || !images.every((i) => typeof i === 'string'))) {
      res.status(400).json({ message: 'images must be an array of URLs' });
      return;
    }
    if (variants !== undefined && variants.length > 0 && !validateVariants(variants)) {
      res.status(400).json({
        message: 'each variant needs a non-negative integer stock and at least one of size/color',
      });
      return;
    }

    const product = await updateProduct(productId, { name, description, category, price, stock, images, variants });
    res.json({ product });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function removeProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteProduct(req.params.productId as string);
    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const csv = await exportProductsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function importProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = (req as any).file as { buffer: Buffer } | undefined;
    if (!file) {
      res.status(400).json({ message: 'CSV file is required (field name "file")' });
      return;
    }
    const result = await importProductsCsv(file.buffer);
    res.json(result);
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}
