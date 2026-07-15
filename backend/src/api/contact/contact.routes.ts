import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/auth';
import {
  createContact,
  getContacts,
  getContact,
  respondToContact,
  changeContactStatus,
  removeContact,
} from './contact.controller';

const router = Router();

// Public — anyone can submit a contact inquiry
router.post('/', createContact);

// Admin only
router.use(authenticate, requireAdmin);
router.get('/', getContacts);
router.get('/:contactId', getContact);
router.put('/:contactId/reply', respondToContact);
router.put('/:contactId/status', changeContactStatus);
router.delete('/:contactId', removeContact);

export default router;
