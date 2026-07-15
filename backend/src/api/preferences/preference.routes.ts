import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  fetchPreference,
  addPreference,
  modifyPreference,
  resetToDefaults,
  removePreference,
} from './preference.controller';

const router = Router();

router.use(authenticate);

router.get('/', fetchPreference);
router.post('/', addPreference);
router.put('/', modifyPreference);
router.patch('/reset', resetToDefaults);
router.delete('/', removePreference);

export default router;
