import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RoomsPage from './pages/RoomsPage';
import ResidentsPage from './pages/ResidentsPage';
import MaintenancePage from './pages/MaintenancePage';
import BillingPage from './pages/BillingPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-dark"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="residents" element={<ProtectedRoute roles={['admin','staff']}><ResidentsPage /></ProtectedRoute>} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['admin','staff']}><ReportsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e2535', color: '#e2e8f0', border: '1px solid #2a3347', borderRadius: '10px', fontSize: '13px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e2535' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e2535' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
