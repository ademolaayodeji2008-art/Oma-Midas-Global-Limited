/**
 * App.jsx — React Router v6 with all routes, ProtectedRoute, AuthProvider, ToastProvider.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Public pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import PendingApproval from './pages/public/PendingApproval';
import Rejected from './pages/public/Rejected';

// Member pages
import MemberDashboard from './pages/member/Dashboard';
import Contributions from './pages/member/Contributions';
import LoanRequest from './pages/member/LoanRequest';
import LoanRepayment from './pages/member/LoanRepayment';
import Refund from './pages/member/Refund';
import Transactions from './pages/member/Transactions';
import Profile from './pages/member/Profile';
import Notifications from './pages/member/Notifications';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Loans from './pages/admin/Loans';
import Refunds from './pages/admin/Refunds';
import CompanyFund from './pages/admin/CompanyFund';
import Reports from './pages/admin/Reports';
import AuditLog from './pages/admin/AuditLog';
import Settings from './pages/admin/Settings';

/** Loading spinner shown while auth is being resolved. */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" aria-label="Loading">
      <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * ProtectedRoute — checks auth + role. Redirects appropriately.
 * @param {'MEMBER'|'ADMIN'} requiredRole
 */
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Block PENDING/REJECTED members from accessing protected pages
  if (user.status === 'PENDING') return <Navigate to="/pending" replace />;
  if (user.status === 'REJECTED') {
    const reason = user.rejectionReason ? `?reason=${encodeURIComponent(user.rejectionReason)}` : '';
    return <Navigate to={`/rejected${reason}`} replace />;
  }

  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    return <Navigate to="/member/dashboard" replace />;
  }

  if (requiredRole === 'MEMBER' && user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

/** Routes wrapped in AnimatePresence for page transitions. */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/rejected" element={<Rejected />} />

        {/* Member routes */}
        <Route path="/member/dashboard" element={<ProtectedRoute requiredRole="MEMBER"><MemberDashboard /></ProtectedRoute>} />
        <Route path="/member/contributions" element={<ProtectedRoute requiredRole="MEMBER"><Contributions /></ProtectedRoute>} />
        <Route path="/member/loan-request" element={<ProtectedRoute requiredRole="MEMBER"><LoanRequest /></ProtectedRoute>} />
        <Route path="/member/loan-repayment" element={<ProtectedRoute requiredRole="MEMBER"><LoanRepayment /></ProtectedRoute>} />
        <Route path="/member/refund" element={<ProtectedRoute requiredRole="MEMBER"><Refund /></ProtectedRoute>} />
        <Route path="/member/transactions" element={<ProtectedRoute requiredRole="MEMBER"><Transactions /></ProtectedRoute>} />
        <Route path="/member/profile" element={<ProtectedRoute requiredRole="MEMBER"><Profile /></ProtectedRoute>} />
        <Route path="/member/notifications" element={<ProtectedRoute requiredRole="MEMBER"><Notifications /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute requiredRole="ADMIN"><Members /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute requiredRole="ADMIN"><Loans /></ProtectedRoute>} />
        <Route path="/admin/refunds" element={<ProtectedRoute requiredRole="ADMIN"><Refunds /></ProtectedRoute>} />
        <Route path="/admin/company-fund" element={<ProtectedRoute requiredRole="ADMIN"><CompanyFund /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="ADMIN"><Reports /></ProtectedRoute>} />
        <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="ADMIN"><AuditLog /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
