import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductReviewsPage from './pages/ProductReviewsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RewardsPage from './pages/RewardsPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import SettingsPage from './pages/SettingsPage';
import ProfileEditPage from './pages/ProfileEditPage';
import AddressBookPage from './pages/AddressBookPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/product/:id/reviews" element={<ProductReviewsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/checkout"
                    element={
                      <RequireAuth>
                        <CheckoutPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/order-confirmation/:orderId"
                    element={
                      <RequireAuth>
                        <OrderConfirmationPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <RequireAuth>
                        <OrdersPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/orders/:orderId"
                    element={
                      <RequireAuth>
                        <OrderDetailPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/rewards"
                    element={
                      <RequireAuth>
                        <RewardsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RequireAuth>
                        <SettingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile-edit"
                    element={
                      <RequireAuth>
                        <ProfileEditPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/addresses"
                    element={
                      <RequireAuth>
                        <AddressBookPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <RequireAuth>
                        <WishlistPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
