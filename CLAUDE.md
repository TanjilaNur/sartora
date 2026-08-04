# CLAUDE.md — Sartora

## Stack
```json
{
  "includeBackend": true,
  "includeDatabase": true,
  "includeAdminPanel": true,
  "includeMobile": true,
  "backend": "node-express",
  "backendArchPattern": "mvc",
  "apiStyle": "rest",
  "authStrategy": "JWT",
  "database": "mongodb",
  "dataLayer": "Mongoose",
  "mobileFramework": "flutter",
  "mobileStateManagement": "GetX",
  "mobileArchPattern": "mvc",
  "deploymentTarget": "local",
  "userNotes": ""
}
```

## SRS Summary
# SRS — Dress Shop Management System
## 1. Scope
The Dress Shop Management System (DSMS) will allow users to browse, purchase, and manage categories of dresses via a mobile app, while administrators can manage products and orders through a React-based admin panel. The system will cater to multi-category dress sales and support local deployment.

## 2. Assumptions
- The backend will be built using Node.js with the Express framework.
- MongoDB will be used for all data storage requirements.
- The admin panel will be built using React and Ant Design.
- The mobile app will be developed using Flutter.
- No 3rd party services are currently specified for payment, notification, or analytics.
- The application will run in a local deployment environment.

## 3. Functional Requirements

### FR-001 — User Registration | Priority: High
Users must be able to register for an account.
**Acceptance Criteria:**
- The system should capture username, email, password, and phone number during registration.
- The email must be unique across the system.
- Users receive a confirmation email upon successful registration.

### FR-002 — Browse Dresses | Priority: High
Users should be able to browse dresses by category.
**Acceptance Criteria:**
- Categories should be dynamically loaded from the database.
- Users should view all dresses within a selected category.
- Pagination or infinite scroll must be implemented for dress listings.

### FR-003 — Add to Cart | Priority: High
Users should be able to add dresses to a shopping cart.
**Acceptance Criteria:**
- Users can add individual items to the cart from the product detail page.
- The system updates the cart total dynamically upon addition.
- Invalid actions like adding out-of-stock items will return an error.

### FR-004 — Checkout and Order Placement | Priority: High
Users should be able to place orders for selected items.
**Acceptance Criteria:**
- The system requires all mandatory fields (address, payment details) to proceed with the order.

## Architecture
# Architecture Document for Dress Shop Management System (DSMS)

## 1. Folder Structure

### Backend (Node.js + Express.js + Mongoose)
```
/backend
|
├── /src
│   ├── /api
│   │   ├── /users
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   ├── user.model.js
│   │   └── /products
│   │       ├── product.controller.js
│   │       ├── product.service.js
│   │       ├── product.routes.js
│   │       ├── product.model.js
│   ├── /middlewares
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   ├── /utils
│   │   ├── validation.js
│   │   ├── mailer.js
│   ├── /config
│   │   ├── db.js
│   │   ├── env.js
│   ├── /tests
│   │   ├── user.test.js
│   │   ├── product.test.js
│   ├── index.js
|
├── package.json
└── README.md
```

### Admin Panel (React + Ant Design)
```
/admin
|
├── /src
│   ├── /components
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   ├── /pages
│   │   ├── Dashboard.js
│   │   ├── ProductManagement.js
│   │   ├── CategoryManagement.js
│   ├── /services
│   │   ├── api.js
│   ├── /context
│   │   ├── AuthContext.js
│   ├── index.js
|
├── package.json
└── README.md
```

### Mobile App (Flutter + GetX)
```
/mobile
|
├── /lib
│   ├── /controllers
│   │   ├── auth_controller.dart
│   │   ├── product_controller.dart
│   ├── /models
│   │   ├── user.dart
│   │   ├── product.dart
│   │   ├── cart.dart
│   ├── /pages
│   │   ├── home_page.dart
│   │   ├── product_detail.dart
│   ├── /services
│   │   ├── api_service.dart
│   ├── /widgets
│   │   ├── bottom_nav.dart
│   │   ├── product_card.dart
│   ├── main.dart
|
├── pubspec.yaml
└── README.md
```

---

## 2. Traceability Table

| FR-ID   | Corresponding Module                           |
|---------|-----------------------------------------------|
| FR-001  | `backend/src/api/users/user.controller.js`    |
| FR-002  | `backend/src/api/products/product.controller.js` |
| FR-003  | `backend/src/api/users/user.controller.js` (cart logic implemented with User model) |
| FR-004  | `backend/src/api/orders/order.controller.js`  |
| FR-005  | `backend/src/api/products/product.controller.js` |
| FR-006  | `backend/src/middlewares/auth.js`, `backend/src/api/users/user.controller.js` |
| FR-007  | `backend/src/api/categories/category.controller.js` |
| FR-008  | `backend/src/api/products/product.controller.js` (search logic) |

---

## 3. API Endpoints

### User Authentication
| Method | Path               | Request Body                     | Response                     | Auth  | FR-ID  |
|--------|---------------------|----------------------------------|------------------------------|-------|--------|
| POST   | /api/auth/register  | `{email, password, name, phone}`| `{message, token}`           | None  | FR-001 |
| POST   | /api/auth/login     | `{email, password}`             | `{token, user}`              | None  | FR-006 |

### Product Management
| Method | Path                   | Request Body                  | Response                  

## Commands
- Backend: `cd backend && npm run dev` (port 4000)
- Admin Panel: `cd admin-panel && npm run dev` (port 4001)
- Mobile: `cd mobile && flutter run` (or appropriate command for the framework)
- Tests: `npm test`
