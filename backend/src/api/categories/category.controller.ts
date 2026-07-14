import { Request, Response, NextFunction } from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.service';

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function addCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as { name: string };
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'name is required' });
      return;
    }
    const category = await createCategory(name);
    res.status(201).json({ category });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function editCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const { name } = req.body as { name: string };
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'name is required' });
      return;
    }
    const category = await updateCategory(id, name);
    res.json({ category });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}

export async function removeCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    await deleteCategory(id);
    res.json({ message: 'Category deleted' });
  } catch (err: any) {
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      next(err);
    }
  }
}
