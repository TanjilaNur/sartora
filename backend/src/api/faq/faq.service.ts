import { FAQ, IFAQ } from './faq.model';

function notFound(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 404;
  throw err;
}

function badRequest(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 400;
  throw err;
}

export async function createFAQ(
  question: string,
  answer: string,
  category?: string,
  order?: number
): Promise<IFAQ> {
  if (!question?.trim()) badRequest('question is required');
  if (!answer?.trim()) badRequest('answer is required');
  return FAQ.create({
    question: question.trim(),
    answer: answer.trim(),
    category: category?.trim() || 'General',
    order: order ?? 0,
  });
}

export async function listFAQs(
  category?: string,
  includeInactive = false
): Promise<IFAQ[]> {
  const filter: Record<string, any> = {};
  if (!includeInactive) filter.active = true;
  if (category) filter.category = category;
  return FAQ.find(filter).sort({ order: 1, createdAt: 1 }).lean() as unknown as Promise<IFAQ[]>;
}

export async function getFAQById(faqId: string): Promise<IFAQ> {
  const faq = await FAQ.findById(faqId).lean();
  if (!faq) notFound('FAQ not found');
  return faq as unknown as IFAQ;
}

export async function updateFAQ(
  faqId: string,
  updates: { question?: string; answer?: string; category?: string; order?: number; active?: boolean }
): Promise<IFAQ> {
  const faq = await FAQ.findById(faqId);
  if (!faq) notFound('FAQ not found');
  if (updates.question !== undefined) {
    if (!updates.question.trim()) badRequest('question cannot be empty');
    faq.question = updates.question.trim();
  }
  if (updates.answer !== undefined) {
    if (!updates.answer.trim()) badRequest('answer cannot be empty');
    faq.answer = updates.answer.trim();
  }
  if (updates.category !== undefined) faq.category = updates.category.trim() || 'General';
  if (updates.order !== undefined) faq.order = updates.order;
  if (updates.active !== undefined) faq.active = updates.active;
  await faq.save();
  return faq;
}

export async function deleteFAQ(faqId: string): Promise<void> {
  const faq = await FAQ.findById(faqId);
  if (!faq) notFound('FAQ not found');
  await faq.deleteOne();
}

export async function listFAQCategories(): Promise<string[]> {
  return FAQ.distinct('category', { active: true });
}
