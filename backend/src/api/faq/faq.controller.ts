import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  createFAQ,
  listFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
  listFAQCategories,
} from './faq.service';

export async function addFAQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { question, answer, category, order } = req.body as {
      question: string; answer: string; category?: string; order?: number;
    };
    const faq = await createFAQ(question, answer, category, order);
    res.status(201).json({ faq });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getFAQs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const faqs = await listFAQs(category, false);
    res.json({ faqs });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getAllFAQs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = req.query.category as string | undefined;
    const faqs = await listFAQs(category, true);
    res.json({ faqs });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getFAQ(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const faq = await getFAQById(req.params.faqId as string);
    res.json({ faq });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function editFAQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const updates = req.body as {
      question?: string; answer?: string; category?: string; order?: number; active?: boolean;
    };
    const faq = await updateFAQ(req.params.faqId as string, updates);
    res.json({ faq });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeFAQ(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteFAQ(req.params.faqId as string);
    res.json({ message: 'FAQ deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getFAQCategoryList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await listFAQCategories();
    res.json({ categories });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
