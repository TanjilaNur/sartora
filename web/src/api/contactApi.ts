import axios from 'axios';
import { API } from './client';

export async function submitContactForm(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await axios.post(`${API}/contact`, input);
}
