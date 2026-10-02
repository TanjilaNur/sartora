<div align="center">

<img src="docs/screenshots/web/web-home.png" width="720" alt="Sartora storefront" />

# Sartora

**A full-stack, multi-category dress shop platform** — storefront, mobile app, admin panel, and REST API, built as one cohesive product.

![Node.js](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-6DA55F?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/database-MongoDB-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/web%20%2F%20admin-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)
![Flutter](https://img.shields.io/badge/mobile-Flutter-02569B?logo=flutter&logoColor=white)
![Ant Design](https://img.shields.io/badge/UI-Ant%20Design-0170FE?logo=antdesign&logoColor=white)

</div>

---

## About

Sartora is a dress shop where customers browse and buy clothing across multiple categories — tops, bottoms, dresses, outerwear, footwear, and accessories — while store staff manage the catalog, orders, and promotions from a dedicated admin panel. The system was generated end-to-end through a staged AI pipeline (requirements → architecture → estimation → implementation → integration), with every layer — API, database, admin dashboard, and mobile app — built and reviewed as part of a single delivery.

**Core capabilities:**

| | |
|---|---|
| 🔐 **Accounts** | Email/password + phone (SMS) login, JWT access & refresh tokens, Google sign-in |
| 👗 **Catalog** | Category browsing, full-text search, product reviews & ratings |
| 🛒 **Cart & Checkout** | Guest and authenticated carts, Stripe payments, order history, refunds |
| 🎁 **Promotions** | Promo codes, points ledger, badges, and a shopper leaderboard |
| 🛠️ **Admin Panel** | Products, categories, orders, payments, refunds, reviews, customers, promotions, FAQ/contact — all in one dashboard |
| 📱 **Mobile** | A full native-feeling Flutter app mirroring the web storefront |

---

## Tech Stack

| Module | Stack |
|---|---|
| **Backend** | Node.js, Express 5, MongoDB + Mongoose, JWT auth, bcrypt, Stripe |
| **Admin Panel** | React 19, Vite, TypeScript, Ant Design 6 |
| **Web Storefront** | React 19, Vite, TypeScript, Tailwind CSS, Stripe.js |
| **Mobile App** | Flutter, GetX (state management), Firebase (push notifications), flutter_secure_storage |

Architecture: REST API (MVC-style, resource-per-folder) consumed by three independent clients — admin panel, web storefront, and mobile app — all talking to the same backend.

---

## Modules

### 🛍️ Web Storefront (`/web`)

The customer-facing shopping site: browse by category, search, view product detail, manage a cart (as a guest or signed in), check out, track orders, and earn/redeem rewards.

<table>
<tr>
<td width="33%"><img src="docs/screenshots/web/web-home.png" alt="Web home / catalog" /><br/><sub align="center">Home & catalog</sub></td>
<td width="33%"><img src="docs/screenshots/web/web-product-detail.png" alt="Web product detail" /><br/><sub>Product detail</sub></td>
<td width="33%"><img src="docs/screenshots/web/web-cart.png" alt="Web cart" /><br/><sub>Cart (guest checkout)</sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/web/web-login.png" alt="Web login" /><br/><sub>Sign in</sub></td>
<td width="33%"><img src="docs/screenshots/web/web-orders.png" alt="Web order history" /><br/><sub>Order history</sub></td>
<td width="33%"><img src="docs/screenshots/web/web-rewards.png" alt="Web rewards" /><br/><sub>Rewards & points</sub></td>
</tr>
</table>

### 📱 Mobile App (`/mobile`)

A full-featured Flutter app mirroring the web storefront: guest and signed-in shopping, checkout with multiple payment methods, order confirmation, a points/badges/leaderboard system, dark mode, reviews, and a help center.

<table>
<tr>
<td width="25%"><img src="docs/screenshots/mobile/mobile-login.png" alt="Mobile login" /><br/><sub>Sign in</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-home.png" alt="Mobile home" /><br/><sub>Signed-in home</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-catalog.png" alt="Mobile catalog" /><br/><sub>Catalog</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-catalog-accessories.png" alt="Mobile catalog filtered by category" /><br/><sub>Category filter</sub></td>
</tr>
<tr>
<td width="25%"><img src="docs/screenshots/mobile/mobile-product-detail.png" alt="Mobile product detail" /><br/><sub>Product detail</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-cart.png" alt="Mobile cart" /><br/><sub>Cart</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-checkout.png" alt="Mobile checkout" /><br/><sub>Checkout</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-checkout-payment.png" alt="Mobile checkout payment methods" /><br/><sub>Payment methods</sub></td>
</tr>
<tr>
<td width="25%"><img src="docs/screenshots/mobile/mobile-order-confirmed.png" alt="Mobile order confirmed" /><br/><sub>Order confirmed</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-rewards.png" alt="Mobile rewards" /><br/><sub>Rewards & leaderboard</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-write-review.png" alt="Mobile write a review" /><br/><sub>Write a review</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-help-support.png" alt="Mobile help and support" /><br/><sub>Help & support</sub></td>
</tr>
<tr>
<td width="25%"><img src="docs/screenshots/mobile/mobile-faq.png" alt="Mobile FAQ" /><br/><sub>FAQ</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-contact-us.png" alt="Mobile contact us" /><br/><sub>Contact us</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-guest-catalog.png" alt="Mobile guest catalog" /><br/><sub>Guest mode</sub></td>
<td width="25%"><img src="docs/screenshots/mobile/mobile-dark-mode.png" alt="Mobile dark mode" /><br/><sub>Dark mode</sub></td>
</tr>
</table>

### 🛠️ Admin Panel (`/admin-panel`)

The operations dashboard for running the store: live sales/order metrics, full CRUD over products and categories, order and refund processing, promotions, and customer support content.

<table>
<tr>
<td width="33%"><img src="docs/screenshots/admin/admin-login.png" alt="Admin login" /><br/><sub>Sign in</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-dashboard.png" alt="Admin dashboard" /><br/><sub>Dashboard</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-products.png" alt="Admin products" /><br/><sub>Products</sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/admin/admin-categories.png" alt="Admin categories" /><br/><sub>Categories</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-orders.png" alt="Admin orders" /><br/><sub>Orders</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-customers.png" alt="Admin customers" /><br/><sub>Customers</sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/admin/admin-payments.png" alt="Admin payments" /><br/><sub>Payments</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-refunds.png" alt="Admin refunds" /><br/><sub>Refunds</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-reviews.png" alt="Admin reviews" /><br/><sub>Reviews</sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/admin/admin-promotions.png" alt="Admin promotions" /><br/><sub>Promotions</sub></td>
<td width="33%"><img src="docs/screenshots/admin/admin-points-badges.png" alt="Admin points and badges" /><br/><sub>Points & badges</sub></td>
<td width="33%"></td>
</tr>
</table>

### ⚙️ Backend API (`/backend`)

A REST API with 16 resource groups, each following the same controller → service → model layout:

`auth` · `users` · `categories` · `products` · `cart` · `guest cart` · `orders` · `payments` (Stripe) · `refunds` · `reviews` · `promotions` · `points & badges` · `preferences` · `contact` · `faq` · `analytics`

JWT-based auth (access + refresh tokens) with bcrypt password hashing, rate limiting on login endpoints, and a Stripe webhook for payment/refund events. 245 automated tests cover all 16 resource groups.

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- Flutter SDK 3.x (for the mobile app)

### 1. Backend — `http://localhost:4000`
```bash
cd backend
cp .env.example .env   # fill in Stripe keys, etc.
npm install
npm run dev
npm run seed            # optional: populate sample products, users, orders
```

### 2. Admin Panel — `http://localhost:4001`
```bash
cd admin-panel
npm install
npm run dev
```

### 3. Web Storefront
```bash
cd web
npm install
npm run dev
```

### 4. Mobile App
```bash
cd mobile
flutter pub get
flutter run              # connects to http://localhost:4000
```
> On a physical device, update `baseUrl` in `lib/core/constants/api_constants.dart` to your machine's LAN IP.

### Sample credentials (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@dressshop.com` | `Admin@123` |
| Customer | `sarah@example.com` | `User@123` |
| Customer | `james@example.com` | `User@123` |

---

## Project Structure

```
.
├── backend/        # Node.js + Express + MongoDB REST API
├── admin-panel/    # React + Ant Design admin dashboard
├── web/            # React + Tailwind customer storefront
├── mobile/         # Flutter shopping app
├── docs/           # Screenshots and supporting docs
└── app.config.json # Branding/config used by the App Builder
```
