import { Contact, IContact } from './contact.model';

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

export async function submitContact(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<IContact> {
  if (!name?.trim()) badRequest('name is required');
  if (!email?.trim()) badRequest('email is required');
  if (!subject?.trim()) badRequest('subject is required');
  if (!message?.trim()) badRequest('message is required');
  return Contact.create({ name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() });
}

export async function listContacts(
  status?: string,
  page = 1,
  limit = 20
): Promise<{ contacts: IContact[]; total: number; page: number; pages: number }> {
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Contact.countDocuments(filter),
  ]);
  return { contacts: contacts as unknown as IContact[], total, page, pages: Math.ceil(total / limit) };
}

export async function getContactById(contactId: string): Promise<IContact> {
  const contact = await Contact.findById(contactId).lean();
  if (!contact) notFound('Contact not found');
  return contact as unknown as IContact;
}

export async function replyToContact(contactId: string, reply: string): Promise<IContact> {
  if (!reply?.trim()) badRequest('reply is required');
  const contact = await Contact.findById(contactId);
  if (!contact) notFound('Contact not found');
  contact.reply = reply.trim();
  contact.status = 'resolved';
  await contact.save();
  return contact;
}

export async function updateContactStatus(
  contactId: string,
  status: 'open' | 'resolved' | 'closed'
): Promise<IContact> {
  const validStatuses = ['open', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) badRequest('Invalid status');
  const contact = await Contact.findById(contactId);
  if (!contact) notFound('Contact not found');
  contact.status = status;
  await contact.save();
  return contact;
}

export async function deleteContact(contactId: string): Promise<void> {
  const contact = await Contact.findById(contactId);
  if (!contact) notFound('Contact not found');
  await contact.deleteOne();
}
