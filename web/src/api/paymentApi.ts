import axios from 'axios';
import { API, authHeader } from './client';

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  amount: number;
  currency: string;
}

export async function createPaymentIntent(input: {
  address: Record<string, string>;
  currency?: string;
  promoCode?: string;
}): Promise<PaymentIntentResult> {
  const { data } = await axios.post<PaymentIntentResult>(
    `${API}/payments/intent`,
    { address: input.address, currency: input.currency ?? 'usd', promoCode: input.promoCode },
    { headers: authHeader() }
  );
  return data;
}
