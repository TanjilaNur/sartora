import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  addFAQ,
  getFAQs,
  getAllFAQs,
  getFAQ,
  editFAQ,
  removeFAQ,
  getFAQCategoryList,
} from './faq.controller';

const router = Router();

// Public
router.get('/', getFAQs);
router.get('/categories', getFAQCategoryList);
router.get('/:faqId', getFAQ);

// Admin only
router.post('/', authenticate, requireAdmin, addFAQ);
router.get('/admin/all', authenticate, requireAdmin, getAllFAQs);
router.put('/:faqId', authenticate, requireAdmin, editFAQ);
router.delete('/:faqId', authenticate, requireAdmin, removeFAQ);

export default router;
