import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Spinner from './components/ui/Spinner';
import Landing from './pages/Landing';

// Lazy pages
import { lazy, Suspense } from 'react';
const Zones = lazy(() => import('./pages/infrastructure/Zones'));
const Tanks = lazy(() => import('./pages/infrastructure/Tanks'));
const Taps = lazy(() => import('./pages/infrastructure/Taps'));
const Households = lazy(() => import('./pages/people/Households'));
const Members = lazy(() => import('./pages/people/Members'));
const Committee = lazy(() => import('./pages/people/Committee'));
const Users = lazy(() => import('./pages/people/Users'));
const Subscriptions = lazy(() => import('./pages/finance/Subscriptions'));
const Payments = lazy(() => import('./pages/finance/Payments'));
const Maintenance = lazy(() => import('./pages/finance/Maintenance'));
const Expenditures = lazy(() => import('./pages/finance/Expenditures'));
const CommitteePayments = lazy(() => import('./pages/finance/CommitteePayments'));
const Reports = lazy(() => import('./pages/finance/Reports'));
const MySubscription = lazy(() => import('./pages/finance/MySubscription'));

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* Infrastructure */}
      <Route path="/infrastructure/zones" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Zones /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/infrastructure/tanks" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Tanks /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/infrastructure/taps" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Taps /></Suspense></Layout>
        </ProtectedRoute>
      } />

      {/* People */}
      <Route path="/people/households" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Households /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/people/members" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Members /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/people/committee" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Committee /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/people/users" element={
        <ProtectedRoute roles={['system_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Users /></Suspense></Layout>
        </ProtectedRoute>
      } />

      {/* Finance */}
      <Route path="/finance/subscriptions" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Subscriptions /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/finance/payments" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Payments /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/finance/maintenance" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Maintenance /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/finance/expenditures" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Expenditures /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/finance/committee-payments" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><CommitteePayments /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute roles={['system_admin', 'zonal_admin']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><Reports /></Suspense></Layout>
        </ProtectedRoute>
      } />
      <Route path="/my-subscription" element={
        <ProtectedRoute roles={['representative']}>
          <Layout><Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}><MySubscription /></Suspense></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}