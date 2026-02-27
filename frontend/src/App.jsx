import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Welcome from './pages/Welcome';
import ComingSoon from './pages/ComingSoon';

import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import Predictions from './pages/owner/Predictions';
import SalesPatterns from './pages/owner/SalesPatterns';
import GeoMap from './pages/owner/GeoMap';
import DecisionSupport from './pages/owner/DecisionSupport';
import Forecast from './pages/owner/Forecast';
import Recommendations from './pages/owner/Recommendations';
import Inventory from './pages/owner/Inventory';
import OrderManagement from './pages/owner/OrderManagement';

import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerShop from './pages/customer/CustomerShop';
import CustomerHome from './pages/customer/CustomerHome';
import ProductDetails from './pages/customer/ProductDetails';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyOrders from './pages/customer/MyOrders';
import Profile from './pages/customer/Profile';

import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMLOps from './pages/admin/AdminMLOps';

import useAuthStore from './store/authStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" />;

  return children;
};

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public Pages - Coming Soon */}
          <Route path="/solutions" element={<ComingSoon title="Solutions" />} />
          <Route path="/case-studies" element={<ComingSoon title="Case Studies" />} />
          <Route path="/pricing" element={<ComingSoon title="Pricing" />} />
          <Route path="/features" element={<ComingSoon title="Features" />} />
          <Route path="/integrations" element={<ComingSoon title="Integrations" />} />
          <Route path="/enterprise" element={<ComingSoon title="Enterprise" />} />
          <Route path="/security" element={<ComingSoon title="Security" />} />
          <Route path="/documentation" element={<ComingSoon title="Documentation" />} />
          <Route path="/api-reference" element={<ComingSoon title="API Reference" />} />
          <Route path="/blog" element={<ComingSoon title="Blog" />} />
          <Route path="/community" element={<ComingSoon title="Community" />} />
          <Route path="/about" element={<ComingSoon title="About Us" />} />
          <Route path="/careers" element={<ComingSoon title="Careers" />} />
          <Route path="/legal" element={<ComingSoon title="Legal" />} />
          <Route path="/contact" element={<ComingSoon title="Contact Us" />} />
          <Route path="/privacy" element={<ComingSoon title="Privacy Policy" />} />
          <Route path="/terms" element={<ComingSoon title="Terms of Service" />} />



          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="ml-ops" element={<AdminMLOps />} />
          </Route>

          {/* Owner Routes */}
          <Route path="/owner" element={
            <ProtectedRoute allowedRole="OWNER">
              <OwnerLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="predictions/sales-patterns" element={<SalesPatterns />} />
            <Route path="predictions/geo-map" element={<GeoMap />} />
            <Route path="predictions/decision-support" element={<DecisionSupport />} />
            <Route path="predictions/forecast" element={<Forecast />} />
            <Route path="predictions/recommendations" element={<Recommendations />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<OrderManagement />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRole="CUSTOMER">
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<CustomerHome />} />
            <Route path="shop" element={<CustomerShop />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
