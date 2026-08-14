import { Category, ICategory } from './category.model';
import { Product } from '../products/product.model';

export async function getAllCategories(): Promise<ICategory[]> {
  return Category.find().sort({ name: 1 }).lean() as unknown as Promise<ICategory[]>;
}

export async function getCategoryById(id: string): Promise<ICategory> {
  const category = await Category.findById(id).lean();
  if (!category) {
    const err = new Error('Category not found');
    (err as any).status = 404;
    throw err;
  }
  return category as unknown as ICategory;
}

export async function createCategory(name: string): Promise<ICategory> {
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    const err = new Error('Category already exists');
    (err as any).status = 409;
    throw err;
  }
  try {
    return await Category.create({ name: name.trim() });
  } catch (err: any) {
    // Backstopped by the unique index on name — the check above can't close
    // a race between two concurrent creates of the same name.
    if (err.code === 11000) {
      const dup = new Error('Category already exists');
      (dup as any).status = 409;
      throw dup;
    }
    throw err;
  }
}

export async function updateCategory(id: string, name: string): Promise<ICategory> {
  const category = await Category.findByIdAndUpdate(
    id,
    { name: name.trim() },
    { new: true, runValidators: true }
  );
  if (!category) {
    const err = new Error('Category not found');
    (err as any).status = 404;
    throw err;
  }
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Category not found');
    (err as any).status = 404;
    throw err;
  }
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    const err = new Error(`Cannot delete category: ${productCount} product(s) still reference it`);
    (err as any).status = 409;
    throw err;
  }
  await category.deleteOne();
}
