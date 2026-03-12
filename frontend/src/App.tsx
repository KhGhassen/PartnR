import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditEvent from './pages/EditEvent';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/events/new" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
