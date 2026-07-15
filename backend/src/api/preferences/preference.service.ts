import { Types } from 'mongoose';
import { Preference, IPreference } from './preference.model';

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

export async function getPreference(userId: string): Promise<IPreference> {
  let pref = await Preference.findOne({ user: new Types.ObjectId(userId) });
  if (!pref) {
    pref = await Preference.create({ user: new Types.ObjectId(userId), darkMode: false });
  }
  return pref;
}

export async function createPreference(userId: string, darkMode: boolean): Promise<IPreference> {
  const existing = await Preference.findOne({ user: new Types.ObjectId(userId) });
  if (existing) {
    const err = new Error('Preference already exists; use PUT to update');
    (err as any).status = 409;
    throw err;
  }
  return Preference.create({ user: new Types.ObjectId(userId), darkMode });
}

export async function updatePreference(userId: string, darkMode: boolean): Promise<IPreference> {
  if (typeof darkMode !== 'boolean') badRequest('darkMode must be a boolean');
  const pref = await Preference.findOneAndUpdate(
    { user: new Types.ObjectId(userId) },
    { darkMode },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return pref!;
}

export async function resetPreference(userId: string): Promise<IPreference> {
  const pref = await Preference.findOneAndUpdate(
    { user: new Types.ObjectId(userId) },
    { darkMode: false },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return pref!;
}

export async function deletePreference(userId: string): Promise<void> {
  const pref = await Preference.findOne({ user: new Types.ObjectId(userId) });
  if (!pref) notFound('Preference not found');
  await pref!.deleteOne();
}
