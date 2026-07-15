import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import {
  submitContact,
  listContacts,
  getContactById,
  replyToContact,
  updateContactStatus,
  deleteContact,
} from './contact.service';

export async function createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, subject, message } = req.body as {
      name: string; email: string; subject: string; message: string;
    };
    const contact = await submitContact(name, email, subject, message);
    res.status(201).json({ contact });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await listContacts(status, page, limit);
    res.json(result);
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function getContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await getContactById(req.params.contactId as string);
    res.json({ contact });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function respondToContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reply } = req.body as { reply: string };
    const contact = await replyToContact(req.params.contactId as string, reply);
    res.json({ contact });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function changeContactStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body as { status: 'open' | 'resolved' | 'closed' };
    const contact = await updateContactStatus(req.params.contactId as string, status);
    res.json({ contact });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}

export async function removeContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteContact(req.params.contactId as string);
    res.json({ message: 'Contact deleted' });
  } catch (err: any) {
    if (err.status) res.status(err.status).json({ message: err.message });
    else next(err);
  }
}
