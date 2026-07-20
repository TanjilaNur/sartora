import axios from 'axios';
import type { Contact } from '../types/contact';

const BASE = 'http://localhost:4000/api/contact';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchContacts(
  token: string,
  status?: string,
  page = 1,
  limit = 20
): Promise<{ contacts: Contact[]; total: number; page: number; pages: number }> {
  const params: Record<string, string | number> = { page, limit };
  if (status) params.status = status;
  const { data } = await axios.get<{ contacts: Contact[]; total: number; page: number; pages: number }>(
    BASE,
    { headers: authHeader(token), params }
  );
  return data;
}

export async function replyToContact(token: string, contactId: string, reply: string): Promise<Contact> {
  const { data } = await axios.put<{ contact: Contact }>(
    `${BASE}/${contactId}/reply`,
    { reply },
    { headers: authHeader(token) }
  );
  return data.contact;
}

export async function updateContactStatus(
  token: string,
  contactId: string,
  status: 'open' | 'resolved' | 'closed'
): Promise<Contact> {
  const { data } = await axios.put<{ contact: Contact }>(
    `${BASE}/${contactId}/status`,
    { status },
    { headers: authHeader(token) }
  );
  return data.contact;
}

export async function deleteContact(token: string, contactId: string): Promise<void> {
  await axios.delete(`${BASE}/${contactId}`, { headers: authHeader(token) });
}
