import { loadStripe } from '@stripe/stripe-js';

// Placeholder allows the app to boot; replace VITE_STRIPE_PUBLISHABLE_KEY
// with your real key before going live (same convention as the mobile app's
// STRIPE_PUBLISHABLE_KEY).
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_replace_with_your_stripe_publishable_key'
);
