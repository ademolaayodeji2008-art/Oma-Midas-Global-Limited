/**
 * App.jsx — React Router v6 with all routes, ProtectedRoute, AuthProvider, ToastProvider.
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import TopProgressBar from './components/ui/TopProgressBar';
import PageLoader from './components/ui/PageLoader';

// Public pages - lazy loaded
const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/public/Login'));
const Signup = lazy(() => import('./pages/public/Signup'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const PendingApproval = lazy(() => import('./pages/public/PendingApproval'));
const Rejected = lazy(() => import('./pages/public/Rejected'));

// Member pages - lazy loaded
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'));
const Contributions = lazy(() => import('./pages/member/Contributions'));
const LoanRequest = lazy(() => import('./pages/member/LoanRequest'));
const LoanRepayment = lazy(() => import('./pages/member/LoanRepayment'));
const MemberLoanSummary = lazy(() => import('./pages/member/LoanSummary'));
const Refund = lazy(() => import('./pages/member/Refund'));
const Transactions = lazy(() => import('./pages/member/Transactions'));
const Profile = lazy(() => import('./pages/member/Profile'));
const Notifications = lazy(() => import('./pages/member/Notifications'));
const ClearanceCard = lazy(() => import('./pages/member/ClearanceCard'));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Members = lazy(() => import('./pages/admin/Members'));
const MemberDetail = lazy(() => import('./pages/admin/MemberDetail'));
const Loans = lazy(() => import('./pages/admin/Loans'));
const LoanSummary = lazy(() => import('./pages/admin/LoanSummary'));
const Refunds = lazy(() => import('./pages/admin/Refunds'));
const CompanyFund = lazy(() => import('./pages/admin/CompanyFund'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const MemberClearanceCard = lazy(() => import('./pages/admin/MemberClearanceCard'));
const PendingPayments = lazy(() => import('./pages/admin/PendingPayments'));
const Newsletter = lazy(() => import('./pages/admin/Newsletter'));

/** Loading spinner shown while auth is being resolved. */
function LoadingScreen() {
  return <PageLoader />;
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
    <>
      <TopProgressBar />
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
        <Route path="/member/loan-summary" element={<ProtectedRoute requiredRole="MEMBER"><MemberLoanSummary /></ProtectedRoute>} />
        <Route path="/member/refund" element={<ProtectedRoute requiredRole="MEMBER"><Refund /></ProtectedRoute>} />
        <Route path="/member/transactions" element={<ProtectedRoute requiredRole="MEMBER"><Transactions /></ProtectedRoute>} />
        <Route path="/member/profile" element={<ProtectedRoute requiredRole="MEMBER"><Profile /></ProtectedRoute>} />
        <Route path="/member/notifications" element={<ProtectedRoute requiredRole="MEMBER"><Notifications /></ProtectedRoute>} />
        <Route path="/member/clearance-card" element={<ProtectedRoute requiredRole="MEMBER"><ClearanceCard /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/members/:id" element={<ProtectedRoute requiredRole="ADMIN"><MemberDetail /></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute requiredRole="ADMIN"><Members /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute requiredRole="ADMIN"><Loans /></ProtectedRoute>} />
        <Route path="/admin/loan-summary" element={<ProtectedRoute requiredRole="ADMIN"><LoanSummary /></ProtectedRoute>} />
        <Route path="/admin/refunds" element={<ProtectedRoute requiredRole="ADMIN"><Refunds /></ProtectedRoute>} />
        <Route path="/admin/company-fund" element={<ProtectedRoute requiredRole="ADMIN"><CompanyFund /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="ADMIN"><Reports /></ProtectedRoute>} />
        <Route path="/admin/audit-log" element={<ProtectedRoute requiredRole="ADMIN"><AuditLog /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><Settings /></ProtectedRoute>} />
        <Route path="/admin/members/:id/clearance-card" element={<ProtectedRoute requiredRole="ADMIN"><MemberClearanceCard /></ProtectedRoute>} />
        <Route path="/admin/pending-payments" element={<ProtectedRoute requiredRole="ADMIN"><PendingPayments /></ProtectedRoute>} />
        <Route path="/admin/newsletter" element={<ProtectedRoute requiredRole="ADMIN"><Newsletter /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
