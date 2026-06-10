import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditEvent from './pages/EditEvent';
import AnalyticsDashboardPage from './pages/AnalyticsDashboard';
import AdminUsersPage from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAnalytics } from './hooks/useAnalytics';

function AppRoutes() {
  useAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <EmailVerificationBanner />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<EventList />} />
          <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
