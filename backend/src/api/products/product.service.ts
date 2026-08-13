import { parse } from 'csv-parse/sync';
import { Types } from 'mongoose';
import { Product, IProduct, IProductVariant } from './product.model';
import { Category } from '../categories/category.model';

interface ProductFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface VariantInput {
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
}

interface ProductData {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  images?: string[];
  variants?: VariantInput[];
}

function withDerivedStock<T extends Partial<ProductData>>(data: T): T {
  if (data.variants && data.variants.length > 0) {
    return { ...data, stock: data.variants.reduce((sum, v) => sum + (v.stock || 0), 0) };
  }
  return data;
}

export async function getProducts(
  filters: ProductFilters
): Promise<{ products: IProduct[]; total: number; page: number; pages: number }> {
  const { category, search, page = 1, limit = 20 } = filters;
  const query: Record<string, any> = {};

  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    Product.countDocuments(query),
  ]);

  return { products: products as unknown as IProduct[], total, page, pages: Math.ceil(total / limit) };
}

export async function getProductById(id: string): Promise<IProduct> {
  const product = await Product.findById(id).populate('category', 'name').lean();
  if (!product) {
    const err = new Error('Product not found');
    (err as any).status = 404;
    throw err;
  }
  return product as unknown as IProduct;
}

export async function createProduct(data: ProductData): Promise<IProduct> {
  const category = await Category.findById(data.category);
  if (!category) {
    const err = new Error('Category not found');
    (err as any).status = 400;
    throw err;
  }
  const product = await Product.create(withDerivedStock(data));
  return product.populate('category', 'name');
}

export async function updateProduct(id: string, data: Partial<ProductData>): Promise<IProduct> {
  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) {
      const err = new Error('Category not found');
      (err as any).status = 400;
      throw err;
    }
  }

  const product = await Product.findByIdAndUpdate(id, withDerivedStock(data), {
    new: true,
    runValidators: true,
  }).populate('category', 'name');

  if (!product) {
    const err = new Error('Product not found');
    (err as any).status = 404;
    throw err;
  }
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    const err = new Error('Product not found');
    (err as any).status = 404;
    throw err;
  }
}

// ── CSV bulk import/export ──────────────────────────────────────────────────
//
// Variants are packed into one cell as `size:color:stock:priceOverride`
// entries separated by `;` (e.g. `S:Red:10:;M:Red:8:24.99`), and images into
// one cell as URLs separated by `|` — this keeps the format editable in a
// spreadsheet without needing multiple sheets or a JSON column.

const CSV_HEADERS = ['id', 'name', 'description', 'category', 'price', 'stock', 'images', 'variants'];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function variantsToCell(variants: IProductVariant[]): string {
  return variants
    .map((v) => `${v.size ?? ''}:${v.color ?? ''}:${v.stock}:${v.priceOverride ?? ''}`)
    .join(';');
}

function cellToVariants(cell: string): VariantInput[] {
  if (!cell.trim()) return [];
  return cell
    .split(';')
    .filter((entry) => entry.trim())
    .map((entry) => {
      const [size, color, stockStr, priceStr] = entry.split(':');
      return {
        size: size || undefined,
        color: color || undefined,
        stock: parseInt(stockStr, 10) || 0,
        priceOverride: priceStr ? parseFloat(priceStr) : undefined,
      };
    });
}

export async function exportProductsCsv(): Promise<string> {
  const products = await Product.find().populate('category', 'name').lean();
  const rows = products.map((p: any) => [
    p._id.toString(),
    p.name,
    p.description || '',
    p.category?.name || '',
    String(p.price),
    String(p.stock),
    (p.images || []).join('|'),
    variantsToCell(p.variants || []),
  ]);
  return [CSV_HEADERS, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(',')).join('\n');
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export async function importProductsCsv(buffer: Buffer): Promise<ImportResult> {
  let records: Record<string, string>[];
  try {
    records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e: any) {
    const err = new Error(`Could not parse CSV: ${e.message}`);
    (err as any).status = 400;
    throw err;
  }

  const categories = await Category.find().lean();
  const categoryByName = new Map(categories.map((c: any) => [c.name.toLowerCase(), c._id]));

  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const rowNum = i + 2; // header is row 1
    const row = records[i];
    try {
      const name = row.name?.trim();
      if (!name) {
        result.errors.push({ row: rowNum, message: 'Missing product name' });
        continue;
      }

      const categoryId = categoryByName.get((row.category || '').toLowerCase().trim());
      if (!categoryId) {
        result.errors.push({ row: rowNum, message: `Unknown category "${row.category}"` });
        continue;
      }

      const price = parseFloat(row.price);
      if (Number.isNaN(price) || price < 0) {
        result.errors.push({ row: rowNum, message: `Invalid price "${row.price}"` });
        continue;
      }

      const variants = cellToVariants(row.variants || '');
      const stock = variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : parseInt(row.stock, 10) || 0;
      const images = (row.images || '').split('|').map((s) => s.trim()).filter(Boolean);

      const payload = { name, description: row.description?.trim() || '', category: categoryId, price, stock, images, variants };

      if (row.id && Types.ObjectId.isValid(row.id)) {
        const updated = await Product.findByIdAndUpdate(row.id, payload, { runValidators: true });
        if (updated) {
          result.updated++;
          continue;
        }
        // Id doesn't match any current product — most likely a stale export
        // (e.g. the database was reseeded since the CSV was exported, so
        // every _id changed). Fall back to matching by name instead of
        // failing the row outright.
      }

      const existing = await Product.findOne({ name }).collation({ locale: 'en', strength: 2 });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, payload, { runValidators: true });
        result.updated++;
      } else {
        await Product.create(payload);
        result.created++;
      }
    } catch (e: any) {
      result.errors.push({ row: rowNum, message: e.message || 'Unknown error' });
    }
  }

  return result;
}
