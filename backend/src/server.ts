import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './api/auth/auth.routes';
import categoryRoutes from './api/categories/category.routes';
import userRoutes from './api/users/user.routes';
import productRoutes from './api/products/product.routes';
import cartRoutes from './api/cart/cart.routes';
import orderRoutes from './api/orders/order.routes';
import paymentRoutes from './api/payments/payment.routes';
import refundRoutes from './api/refunds/refund.routes';
import reviewRoutes from './api/reviews/review.routes';
import promotionRoutes from './api/promotions/promotion.routes';
import guestRoutes from './api/guest/guest_cart.routes';
import pointsRoutes from './api/points/points.routes';
import badgeRoutes from './api/points/badge.routes';
import contactRoutes from './api/contact/contact.routes';
import faqRoutes from './api/faq/faq.routes';
import preferenceRoutes from './api/preferences/preference.routes';
import analyticsRoutes from './api/analytics/analytics.routes';
import { stripeWebhook } from './api/payments/payment.controller';

dotenv.config();

const app = express();
app.use(cors());
app.use(compression());

// Stripe webhook must receive the raw body for signature verification
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(Number(PORT), '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
