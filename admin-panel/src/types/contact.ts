export interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved' | 'closed';
  reply: string;
  createdAt: string;
  updatedAt: string;
}
