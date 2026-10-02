import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdThemeAlgo } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import PaymentsPage from './pages/PaymentsPage';
import RefundsPage from './pages/RefundsPage';
import ReviewsPage from './pages/ReviewsPage';
import PromotionsPage from './pages/PromotionsPage';
import GuestPage from './pages/GuestPage';
import PointsBadgesPage from './pages/PointsBadgesPage';
import ContactFaqPage from './pages/ContactFaqPage';

const baseToken = {
  colorPrimary: '#660033',
  colorSuccess: '#10B981',
  colorWarning: '#F97316',
  colorError: '#EF4444',
  borderRadius: 8,
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

function ThemedApp() {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdThemeAlgo.darkAlgorithm : antdThemeAlgo.defaultAlgorithm,
        token: baseToken,
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/refunds" element={<RefundsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/promotions" element={<PromotionsPage />} />
              <Route path="/guests" element={<GuestPage />} />
              <Route path="/points" element={<PointsBadgesPage />} />
              <Route path="/contact-faq" element={<ContactFaqPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
