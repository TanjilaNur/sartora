# Dress Shop Management System — Final Integration Report

**Date:** 2026-07-21

---

## 1. What Works

### Backend (Node.js + Express + MongoDB)
- **245 tests pass** across 11 test suites (auth, cart, contact/FAQ, dark-mode preferences, guest mode, order/refund/invoice, payment, phone-login, points/badges/leaderboard, products/categories, reviews/promotions).
- All 16 REST resource groups are wired up and responding:
  - Auth (register, login, phone-login, refresh, logout)
  - Categories, Products, Cart, Orders, Payments (Stripe intent + webhook + refund), Refunds, Reviews, Promotions, Guest cart, Points ledger, Badges, Contact, FAQ, User preferences
- JWT authentication with bcrypt password hashing.
- Rate limiting on login/phone-login endpoints.
- Stripe webhook endpoint handles raw body correctly.

### Admin Panel (React + Ant Design + Vite)
- **`npm run build` succeeds** (TypeScript clean, one non-blocking chunk-size warning from Ant Design).
- All API calls in the admin panel match backend routes:
  - Auth, Categories, Products, Orders, Payments, Refunds, Reviews, Promotions, Guest sessions, Points/Badges, Contact, FAQ.
- Response shapes verified: field names, nesting (`{ category }`, `{ order }`, `{ orders, total, page, pages }`, etc.) all align.

### Mobile (Flutter + GetX)
- **`flutter analyze` — No issues found.**
- **Widget smoke test passes** after fixing two controllers that triggered GetX snackbars on background auto-fetch (FaqController, PointsController now surface errors via observable state instead of pop-up toasts on init).
- All API endpoint calls in mobile controllers verified against backend routes:
  - Auth, Categories, Products, Cart, Orders, Invoice, Payments (Stripe), Refunds, Reviews, Promotions, Guest cart (create / CRUD / merge), Points, Badges, Contact, FAQ.
- Infinite scroll / pagination implemented via `loadMore()` in ProductController.
- Token refresh handled transparently in `ApiService._tryRefresh()`.

---

## 2. How to Run Everything

### Prerequisites
- Node.js 20+, npm
- MongoDB running locally on `mongodb://127.0.0.1:27017/dress-shop`
- Flutter SDK (3.x)

### Backend (port 4000)
```bash
cd backend
cp .env.example .env          # then set real STRIPE keys
npm install
npm run dev                   # nodemon; or: PORT=4000 npm start
```
Health check: `curl http://localhost:4000/health` → `{"status":"ok"}`

### Admin Panel (port 4001)
```bash
cd admin-panel
npm install
npm run dev                   # Vite dev server on port 4001
# or for production:
npm run build && npm run preview -- --port 4001
```
Default admin credentials must be seeded manually (create a user with `role: "admin"` directly in MongoDB, or via the register endpoint followed by a manual role update).

### Mobile App
```bash
cd mobile
flutter pub get
flutter run                   # connects to http://localhost:4000
```
> **Note:** On a physical Android/iOS device, change `baseUrl` in `lib/core/constants/api_constants.dart` from `localhost` to your machine's LAN IP (e.g. `192.168.1.x`).

### Tests
```bash
# Backend
cd backend && npm test

# Mobile
cd mobile && flutter test
```

---

## 3. FR Traceability

| FR-ID | Description | Status | Notes |
|-------|-------------|--------|-------|
| FR-001 | User Registration | **Partial** | Captures name/email/password/phone; email uniqueness enforced. **Confirmation email not sent** — no mailer is configured (consistent with SRS assumption "No 3rd party services"). |
| FR-002 | Browse Dresses | **Complete** | Category filter, text search, pagination (infinite scroll in mobile). |
| FR-003 | Add to Cart | **Complete** | Add/update/remove; out-of-stock guard returns 400; cart total updates. |
| FR-004 | Checkout & Order Placement | **Complete** | Address + paymentDetails required; order stored in DB; confirmation screen shown. |
| FR-005 | Admin Product Management | **Complete** | CRUD via admin panel; required-field validation; changes live immediately. |
| FR-006 | Authentication | **Complete** | JWT access + refresh tokens; bcrypt hashing; unauthorized access blocked. |
| FR-007 | Category Management | **Complete** | CRUD; **deletion guard added** — returns 409 if active products reference the category. |
| FR-008 | Search Functionality | **Complete** | Full-text `search` param + category filter on `/api/products`. |

---

## 4. Known Gaps

### FR-001 — Confirmation email
The SRS requires sending a confirmation email on registration, but also states "No 3rd party services are currently specified." No mailer (Nodemailer, SendGrid, etc.) is wired up. The registration flow stores all data and issues tokens correctly; only the email side-effect is missing.  
**To close:** add a mailer dependency (e.g. `nodemailer`), configure SMTP env vars, and call `sendWelcomeEmail(user.email)` inside `registerUser` in `auth.service.ts`.

### Stripe live keys
Both backend (`.env`) and mobile (`pubspec.yaml` / `main.dart`) ship with placeholder Stripe test keys:
```
STRIPE_SECRET_KEY=sk_test_replace_with_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_stripe_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_replace_with_your_stripe_publishable_key
```
End-to-end payment flow (intent creation, mobile Stripe sheet, webhook fulfillment) requires real Stripe test-mode keys from [https://dashboard.stripe.com](https://dashboard.stripe.com).

### Admin seeding
There is no admin-creation script. To log in to the admin panel, manually set `role: "admin"` on a user document in MongoDB after registering via the API.

### Mobile localhost on device
`ApiConstants.baseUrl` is hardcoded to `http://localhost:4000`. This works on iOS/Android emulators (Android: use `http://10.0.2.2:4000`) but requires a LAN IP for physical devices.
