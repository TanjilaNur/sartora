/**
 * Comprehensive Seed Script — Dress Shop
 * Creates test data for all features across admin and user perspectives.
 *
 * Credentials after seeding:
 *   Admin:  admin@dressshop.com   / Admin@123
 *   User 1: sarah@example.com     / User@123
 *   User 2: james@example.com     / User@123
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from './config/db';

import { User } from './api/users/user.model';
import { Cart } from './api/cart/cart.model';
import { Category } from './api/categories/category.model';
import { Product } from './api/products/product.model';
import { Order } from './api/orders/order.model';
import { Review } from './api/reviews/review.model';
import { Promotion } from './api/promotions/promotion.model';
import { Badge, UserBadge } from './api/points/badge.model';
import { PointsLedger } from './api/points/points_ledger.model';
import { RefundRequest } from './api/refunds/refund.model';
import { FAQ } from './api/faq/faq.model';

// ─── helpers ────────────────────────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const hash = async (pw: string) => bcrypt.hash(pw, 10);

async function seed() {
  await connectDB();
  console.log('🌱 Starting seed — clearing existing data…');

  // Clear all collections in dependency order
  await RefundRequest.deleteMany({});
  await PointsLedger.deleteMany({});
  await UserBadge.deleteMany({});
  await Review.deleteMany({});
  await Order.deleteMany({});
  await Promotion.deleteMany({});
  await FAQ.deleteMany({});
  await Badge.deleteMany({});
  await Product.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  await Cart.deleteMany({});
  console.log('✅ Cleared existing data');

  // ─── Categories ──────────────────────────────────────────────────────────
  const [dresses, tops, bottoms, outerwear, accessories, footwear] =
    await Category.insertMany([
      { name: 'Dresses' },
      { name: 'Tops' },
      { name: 'Bottoms' },
      { name: 'Outerwear' },
      { name: 'Accessories' },
      { name: 'Footwear' },
    ]);
  console.log('✅ Categories created');

  // ─── Products ────────────────────────────────────────────────────────────
  const UNSPLASH = {
    dress1:  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
    dress2:  'https://images.unsplash.com/photo-1566479179817-c0cdbf5ca98a?w=400',
    dress3:  'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400',
    top1:    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400',
    top2:    'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400',
    bottom1: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    bottom2: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4de0?w=400',
    coat1:   'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
    coat2:   'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    bag1:    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    shoes1:  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    shoes2:  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
  };

  const products = await Product.insertMany([
    // Dresses (6)
    { name: 'Floral Wrap Dress', description: 'Light floral wrap dress perfect for summer occasions. Soft chiffon fabric with a flattering V-neckline.', category: dresses._id, price: 89.99, stock: 45, images: [UNSPLASH.dress1, UNSPLASH.dress3], variants: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 10 }], averageRating: 4.5, reviewCount: 0 },
    { name: 'Little Black Dress', description: 'Classic little black dress, a wardrobe staple. Knee-length with subtle side slit.', category: dresses._id, price: 119.99, stock: 30, images: [UNSPLASH.dress2], variants: [{ size: 'S', color: '#000000', stock: 10 }, { size: 'M', color: '#000000', stock: 12 }, { size: 'L', color: '#000000', stock: 8 }], averageRating: 4.8, reviewCount: 0 },
    { name: 'Maxi Boho Dress', description: 'Effortless bohemian maxi dress with tiered ruffles and vibrant print.', category: dresses._id, price: 74.99, stock: 20, images: [UNSPLASH.dress3], averageRating: 4.2, reviewCount: 0 },
    { name: 'Midi Shirt Dress', description: 'Smart-casual midi shirt dress in crisp cotton. Ideal for both office and weekends.', category: dresses._id, price: 99.99, stock: 15, images: [UNSPLASH.dress1], averageRating: 4.6, reviewCount: 0 },
    // Deliberately a PARTIAL size x color matrix (Black: S/M only, Red: M/L
    // only) — exercises the mobile app's cross-filtering between the
    // independent Color and Size rows, not just a trivial full matrix.
    { name: 'Evening Gown', description: 'Elegant floor-length evening gown with sequin embellishments.', category: dresses._id, price: 249.99, stock: 8, images: [UNSPLASH.dress2, UNSPLASH.dress1], variants: [{ size: 'S', color: '#000000', stock: 2 }, { size: 'M', color: '#000000', stock: 2 }, { size: 'M', color: '#7A1F3D', stock: 2 }, { size: 'L', color: '#7A1F3D', stock: 2, priceOverride: 269.99 }], averageRating: 4.9, reviewCount: 0 },
    { name: 'Casual Sundress', description: 'Relaxed cotton sundress with adjustable straps and pockets.', category: dresses._id, price: 49.99, stock: 60, images: [UNSPLASH.dress3], averageRating: 4.3, reviewCount: 0 },
    // Tops (4)
    { name: 'Silk Blouse', description: 'Luxurious silk blouse with pearl button detailing. Available in classic neutrals.', category: tops._id, price: 65.99, stock: 25, images: [UNSPLASH.top1], averageRating: 4.4, reviewCount: 0 },
    { name: 'Striped Linen Tee', description: 'Breathable linen tee in nautical stripes. Perfect casual essential.', category: tops._id, price: 34.99, stock: 80, images: [UNSPLASH.top2], averageRating: 4.1, reviewCount: 0 },
    { name: 'Floral Crop Top', description: 'Trendy crop top with floral print and flutter sleeves.', category: tops._id, price: 29.99, stock: 50, images: [UNSPLASH.top1], averageRating: 4.0, reviewCount: 0 },
    { name: 'Classic White Shirt', description: 'Timeless white button-down shirt in premium cotton. Versatile wardrobe essential.', category: tops._id, price: 55.99, stock: 35, images: [UNSPLASH.top2], variants: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 10 }], averageRating: 4.7, reviewCount: 0 },
    // Bottoms (3)
    { name: 'High-Waist Trousers', description: 'Tailored high-waist trousers in crepe fabric. Professional and polished.', category: bottoms._id, price: 79.99, stock: 22, images: [UNSPLASH.bottom1], averageRating: 4.5, reviewCount: 0 },
    { name: 'Denim Midi Skirt', description: 'Vintage-inspired denim midi skirt with button front.', category: bottoms._id, price: 59.99, stock: 40, images: [UNSPLASH.bottom2], averageRating: 4.3, reviewCount: 0 },
    { name: 'Wide-Leg Linen Pants', description: 'Relaxed wide-leg linen pants, perfect for warm weather.', category: bottoms._id, price: 69.99, stock: 18, images: [UNSPLASH.bottom1], averageRating: 4.2, reviewCount: 0 },
    // Outerwear (2)
    { name: 'Trench Coat', description: 'Classic double-breasted trench coat in camel. A timeless investment piece.', category: outerwear._id, price: 189.99, stock: 12, images: [UNSPLASH.coat1, UNSPLASH.coat2], averageRating: 4.8, reviewCount: 0 },
    { name: 'Oversized Blazer', description: 'On-trend oversized blazer in neutral check. Works as a dress or layering piece.', category: outerwear._id, price: 149.99, stock: 10, images: [UNSPLASH.coat2], averageRating: 4.6, reviewCount: 0 },
    // Accessories (2)
    { name: 'Leather Tote Bag', description: 'Spacious genuine leather tote with interior zip pocket. Work-to-weekend bag.', category: accessories._id, price: 139.99, stock: 20, images: [UNSPLASH.bag1], averageRating: 4.7, reviewCount: 0 },
    { name: 'Gold Pendant Necklace', description: 'Minimalist gold-plated pendant necklace on delicate chain.', category: accessories._id, price: 39.99, stock: 100, images: [UNSPLASH.bag1], averageRating: 4.5, reviewCount: 0 },
    // Footwear (2)
    { name: 'Block Heel Sandals', description: 'Comfortable block-heel sandals with ankle strap. Effortlessly stylish.', category: footwear._id, price: 89.99, stock: 28, images: [UNSPLASH.shoes1], variants: [{ size: '7', stock: 10 }, { size: '8', stock: 12 }, { size: '9', stock: 6 }], averageRating: 4.4, reviewCount: 0 },
    { name: 'White Sneakers', description: 'Clean all-white leather sneakers. The ultimate casual footwear.', category: footwear._id, price: 75.99, stock: 55, images: [UNSPLASH.shoes2], averageRating: 4.6, reviewCount: 0 },
  ]);
  console.log(`✅ ${products.length} products created`);

  // shorthand refs
  const [floralWrap, lbd, maxi, midi, gown, sundress,
    silkBlouse, stripedTee, cropTop, whiteShirt,
    trousers, denim, wideLeg, trench, blazer, tote, necklace, sandals, sneakers] = products;

  // ─── Users ───────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@dressshop.com',
    password: await hash('Admin@123'),
    phone: '+10000000001',
    role: 'admin',
  });

  const sarah = await User.create({
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    password: await hash('User@123'),
    phone: '+10000000002',
    role: 'user',
  });

  const james = await User.create({
    name: 'James Patel',
    email: 'james@example.com',
    password: await hash('User@123'),
    phone: '+10000000003',
    role: 'user',
  });
  console.log('✅ Users created (admin + 2 customers)');

  // Carts now live in their own collection (see api/cart/cart.model.ts).
  // Both dresses have variants, so their cart lines must reference one.
  await Cart.insertMany([
    {
      user: sarah._id,
      items: [
        { product: floralWrap._id, variant: (floralWrap.variants as any)[1]._id, quantity: 1 },
        { product: lbd._id, variant: (lbd.variants as any)[0]._id, quantity: 2 },
        { product: sneakers._id, quantity: 1 },
      ],
    },
    {
      user: james._id,
      items: [
        { product: trench._id, quantity: 1 },
        { product: tote._id, quantity: 1 },
      ],
    },
  ]);
  console.log('✅ Carts seeded for Sarah and James');

  // ─── Promotions ───────────────────────────────────────────────────────────
  await Promotion.insertMany([
    { code: 'WELCOME10', type: 'percent', value: 10, minOrderAmount: 0, maxUses: 500, perUserLimit: 1, active: true, expiresAt: new Date(Date.now() + 30 * 86_400_000) },
    { code: 'SAVE20', type: 'percent', value: 20, minOrderAmount: 100, maxUses: 200, perUserLimit: 1, active: true, expiresAt: new Date(Date.now() + 14 * 86_400_000) },
    { code: 'FLAT15', type: 'fixed', value: 15, minOrderAmount: 75, perUserLimit: 2, active: true },
    { code: 'SUMMER25', type: 'percent', value: 25, minOrderAmount: 150, maxUses: 100, usedCount: 67, perUserLimit: 1, active: true, expiresAt: new Date(Date.now() + 7 * 86_400_000) },
    { code: 'EXPIRED50', type: 'percent', value: 50, minOrderAmount: 0, active: false, expiresAt: daysAgo(5) },
  ]);
  console.log('✅ Promotions created');

  // ─── Orders ───────────────────────────────────────────────────────────────
  const address = { street: '123 Fashion Ave', city: 'New York', state: 'NY', zip: '10001', country: 'US' };

  const sarahOrders = await Order.insertMany([
    // Delivered order (oldest)
    {
      user: sarah._id, createdAt: daysAgo(45),
      items: [{ product: sundress._id, name: sundress.name, price: 49.99, quantity: 2 }, { product: stripedTee._id, name: stripedTee.name, price: 34.99, quantity: 1 }],
      subtotal: 134.97, discount: 13.50, promoCode: 'WELCOME10', total: 121.47,
      address, paymentDetails: { method: 'card', transactionId: 'txn_sarah_001' },
      paymentStatus: 'paid', status: 'delivered',
    },
    // Shipped order
    {
      user: sarah._id, createdAt: daysAgo(10),
      items: [{ product: silkBlouse._id, name: silkBlouse.name, price: 65.99, quantity: 1 }, { product: denim._id, name: denim.name, price: 59.99, quantity: 1 }],
      subtotal: 125.98, discount: 0, total: 125.98,
      address, paymentDetails: { method: 'card', transactionId: 'txn_sarah_002' },
      paymentStatus: 'paid', status: 'shipped',
    },
    // Processing order
    {
      user: sarah._id, createdAt: daysAgo(3),
      items: [{ product: lbd._id, name: lbd.name, price: 119.99, quantity: 1 }, { product: necklace._id, name: necklace.name, price: 39.99, quantity: 2 }],
      subtotal: 199.97, discount: 15, promoCode: 'FLAT15', total: 184.97,
      address, paymentDetails: { method: 'card', transactionId: 'txn_sarah_003' },
      paymentStatus: 'paid', status: 'processing',
    },
    // Pending order (recent)
    {
      user: sarah._id, createdAt: daysAgo(1),
      items: [{ product: trousers._id, name: trousers.name, price: 79.99, quantity: 1 }],
      subtotal: 79.99, discount: 0, total: 79.99,
      address, paymentDetails: { method: 'card', transactionId: 'txn_sarah_004' },
      paymentStatus: 'paid', status: 'pending',
    },
    // Cancelled order
    {
      user: sarah._id, createdAt: daysAgo(20),
      items: [{ product: gown._id, name: gown.name, price: 249.99, quantity: 1 }],
      subtotal: 249.99, discount: 0, total: 249.99,
      address, paymentDetails: { method: 'card', transactionId: 'txn_sarah_005' },
      paymentStatus: 'refunded', status: 'cancelled',
    },
  ]);

  const jamesOrders = await Order.insertMany([
    // Delivered
    {
      user: james._id, createdAt: daysAgo(30),
      items: [{ product: blazer._id, name: blazer.name, price: 149.99, quantity: 1 }, { product: cropTop._id, name: cropTop.name, price: 29.99, quantity: 2 }],
      subtotal: 209.97, discount: 42.0, promoCode: 'SAVE20', total: 167.97,
      address: { street: '456 Style St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
      paymentDetails: { method: 'card', transactionId: 'txn_james_001' },
      paymentStatus: 'paid', status: 'delivered',
    },
    // Shipped
    {
      user: james._id, createdAt: daysAgo(7),
      items: [{ product: trench._id, name: trench.name, price: 189.99, quantity: 1 }],
      subtotal: 189.99, discount: 0, total: 189.99,
      address: { street: '456 Style St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
      paymentDetails: { method: 'card', transactionId: 'txn_james_002' },
      paymentStatus: 'paid', status: 'shipped',
    },
  ]);
  console.log('✅ Orders created (5 for Sarah, 2 for James)');

  // ─── Reviews ──────────────────────────────────────────────────────────────
  const reviews = await Review.insertMany([
    { user: sarah._id, product: sundress._id, rating: 5, text: 'Absolutely love this dress! Perfect fit and the fabric is so soft. Got so many compliments.', verified: true },
    { user: sarah._id, product: stripedTee._id, rating: 4, text: 'Great quality linen tee. Washes well and stays in shape. Sizing runs slightly large.', verified: true },
    { user: sarah._id, product: silkBlouse._id, rating: 5, text: 'Gorgeous silk blouse. Looks incredibly luxurious. The buttons are a nice touch.', verified: true },
    { user: sarah._id, product: denim._id, rating: 4, text: 'Classic midi skirt, very versatile. I wear it at least once a week!', verified: true },
    { user: sarah._id, product: lbd._id, rating: 5, text: 'THE perfect LBD. Fits beautifully and looks incredibly expensive.', verified: true },
    { user: james._id, product: blazer._id, rating: 5, text: 'Incredible oversized blazer. The check pattern is subtle and chic. Bought for my partner and she loves it!', verified: true },
    { user: james._id, product: cropTop._id, rating: 3, text: 'Decent crop top but the material could be a bit thicker. Nice print though.', verified: true },
    { user: james._id, product: trench._id, rating: 5, text: 'Best trench coat I have ever bought. Worth every penny. Classic and well made.', verified: true },
    { user: sarah._id, product: floralWrap._id, rating: 4, text: 'Beautiful wrap dress, lovely floral print. Slightly sheer so wear a slip underneath.', verified: false },
    { user: james._id, product: sandals._id, rating: 4, text: 'Comfortable block heels, good for all-day wear. True to size.', verified: false },
  ]);
  console.log(`✅ ${reviews.length} reviews created`);

  // Update product averageRating & reviewCount
  const reviewsByProduct: Record<string, number[]> = {};
  reviews.forEach(r => {
    const key = String(r.product);
    (reviewsByProduct[key] ||= []).push(r.rating);
  });
  for (const [productId, ratings] of Object.entries(reviewsByProduct)) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await Product.findByIdAndUpdate(productId, { averageRating: parseFloat(avg.toFixed(1)), reviewCount: ratings.length });
  }

  // ─── Refund Request (for cancelled order) ─────────────────────────────────
  await RefundRequest.insertMany([
    { order: sarahOrders[4]._id, user: sarah._id, reason: 'Found a better deal elsewhere. Would like a full refund please.', status: 'approved', adminNote: 'Approved — payment already reversed.' },
    { order: jamesOrders[0]._id, user: james._id, reason: 'One of the crop tops arrived with a small tear near the seam.', status: 'pending' },
  ]);
  console.log('✅ Refund requests created');

  // ─── Badges ────────────────────────────────────────────────────────────────
  const [bronzeBadge, silverBadge, goldBadge, loyalBadge, criticBadge] =
    await Badge.insertMany([
      { key: 'first_purchase', name: 'First Purchase', description: 'Completed your first order.', icon: '🛍️', criteria: { type: 'order_count', value: 1 } },
      { key: 'regular_shopper', name: 'Regular Shopper', description: 'Placed 3 or more orders.', icon: '🛒', criteria: { type: 'order_count', value: 3 } },
      { key: 'big_spender', name: 'Big Spender', description: 'Earned 500 points through purchases.', icon: '💎', criteria: { type: 'points_threshold', value: 500 } },
      { key: 'loyal_customer', name: 'Loyal Customer', description: 'Earned 1000 points.', icon: '⭐', criteria: { type: 'points_threshold', value: 1000 } },
      { key: 'top_reviewer', name: 'Top Reviewer', description: 'Submitted 5 or more reviews.', icon: '✍️', criteria: { type: 'review_count', value: 5 } },
    ]);
  console.log('✅ Badges created');

  // Assign earned badges to Sarah (she has 5 orders & 5 reviews → qualifies for several)
  await UserBadge.insertMany([
    { user: sarah._id, badge: bronzeBadge._id, earnedAt: daysAgo(44) },
    { user: sarah._id, badge: silverBadge._id, earnedAt: daysAgo(9) },
    { user: sarah._id, badge: criticBadge._id, earnedAt: daysAgo(3) },
    { user: james._id, badge: bronzeBadge._id, earnedAt: daysAgo(29) },
  ]);
  console.log('✅ User badges assigned');

  // ─── Points Ledger ────────────────────────────────────────────────────────
  await PointsLedger.insertMany([
    { user: sarah._id, event: 'signup', points: 50, description: 'Welcome bonus', idempotencyKey: `signup_${sarah._id}` },
    { user: sarah._id, event: 'purchase', points: 121, referenceId: String(sarahOrders[0]._id), description: 'Points for order #1', idempotencyKey: `purchase_${sarahOrders[0]._id}` },
    { user: sarah._id, event: 'review', points: 10, referenceId: String(sundress._id), description: 'Review reward — Casual Sundress', idempotencyKey: `review_${sarah._id}_${sundress._id}` },
    { user: sarah._id, event: 'purchase', points: 126, referenceId: String(sarahOrders[1]._id), description: 'Points for order #2', idempotencyKey: `purchase_${sarahOrders[1]._id}` },
    { user: sarah._id, event: 'review', points: 10, referenceId: String(lbd._id), description: 'Review reward — Little Black Dress', idempotencyKey: `review_${sarah._id}_${lbd._id}` },
    { user: sarah._id, event: 'purchase', points: 185, referenceId: String(sarahOrders[2]._id), description: 'Points for order #3', idempotencyKey: `purchase_${sarahOrders[2]._id}` },
    { user: james._id, event: 'signup', points: 50, description: 'Welcome bonus', idempotencyKey: `signup_${james._id}` },
    { user: james._id, event: 'purchase', points: 168, referenceId: String(jamesOrders[0]._id), description: 'Points for order #1', idempotencyKey: `purchase_${jamesOrders[0]._id}` },
    { user: james._id, event: 'review', points: 10, referenceId: String(trench._id), description: 'Review reward — Trench Coat', idempotencyKey: `review_${james._id}_${trench._id}` },
  ]);
  console.log('✅ Points ledger seeded');

  // ─── FAQs ─────────────────────────────────────────────────────────────────
  await FAQ.insertMany([
    { question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery. Items must be unworn and in original packaging. Initiate a return from your Order History page.', category: 'Returns', order: 1 },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 5–7 business days. Express shipping (2–3 days) is available at checkout for an additional fee.', category: 'Shipping', order: 2 },
    { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries. International orders typically arrive within 10–15 business days. Customs duties may apply.', category: 'Shipping', order: 3 },
    { question: 'How do I track my order?', answer: 'Once your order ships you will receive an email with a tracking number. You can also view tracking details in your Order History.', category: 'Orders', order: 4 },
    { question: 'Can I change or cancel my order?', answer: 'Orders can be modified or cancelled within 1 hour of placement. After that the order moves to processing and changes are not possible.', category: 'Orders', order: 5 },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), and digital wallets via Stripe. All payments are processed securely.', category: 'Payments', order: 6 },
    { question: 'How do loyalty points work?', answer: 'Earn 1 point per $1 spent. Points can be redeemed for discounts on future orders. You also earn points for writing reviews and signing up.', category: 'Loyalty', order: 7 },
    { question: 'Are the sizes true to standard sizing?', answer: 'Most items follow standard US sizing. Each product page includes a detailed size guide. If in doubt, we recommend sizing up.', category: 'Products', order: 8 },
  ]);
  console.log('✅ FAQs created');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('✅ Seeding complete!');
  console.log('════════════════════════════════════════');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:  admin@dressshop.com  /  Admin@123');
  console.log('  User 1: sarah@example.com    /  User@123');
  console.log('  User 2: james@example.com    /  User@123');
  console.log('\n📦 Data Summary:');
  console.log('  6  categories');
  console.log('  19 products across all categories');
  console.log('  3  users (1 admin, 2 customers)');
  console.log('  5  promo codes (4 active, 1 expired)');
  console.log('  7  orders (various statuses)');
  console.log('  10 reviews');
  console.log('  2  refund requests');
  console.log('  5  badges + user badge assignments');
  console.log('  9  points ledger entries');
  console.log('  8  FAQs');
  console.log('\n🛒 Sarah\'s cart: Floral Wrap Dress, Little Black Dress (x2), White Sneakers');
  console.log('🛒 James\'s cart:  Trench Coat, Leather Tote Bag');
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
