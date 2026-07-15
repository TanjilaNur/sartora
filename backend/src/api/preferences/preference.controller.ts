import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  getPreference,
  createPreference,
  updatePreference,
  resetPreference,
  deletePreference,
} from './preference.service';

export async function fetchPreference(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pref = await getPreference(req.user!.id);
    res.json({ preference: pref });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function addPreference(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { darkMode } = req.body as { darkMode: boolean };
    const pref = await createPreference(req.user!.id, darkMode ?? false);
    res.status(201).json({ preference: pref });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function modifyPreference(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { darkMode } = req.body as { darkMode: boolean };
    if (typeof darkMode !== 'boolean') {
      res.status(400).json({ message: 'darkMode must be a boolean' });
      return;
    }
    const pref = await updatePreference(req.user!.id, darkMode);
    res.json({ preference: pref });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function resetToDefaults(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const pref = await resetPreference(req.user!.id);
    res.json({ preference: pref, message: 'Preferences reset to defaults' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removePreference(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deletePreference(req.user!.id);
    res.json({ message: 'Preference deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
