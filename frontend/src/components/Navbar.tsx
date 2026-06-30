import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          PartnR
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            Événements
          </Link>
          <Link to="/map" className="text-gray-600 hover:text-gray-900">
            Carte
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/events/new" className="text-gray-600 hover:text-gray-900">
                Créer
              </Link>
              <Link to={`/profile/${user?.id}`} className="text-gray-600 hover:text-gray-900">
                Profil
              </Link>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin/analytics" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Analytics
                  </Link>
                  <Link to="/admin/users" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Utilisateurs
                  </Link>
                  <Link to="/admin/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Événements
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Déconnexion
              </button>
              <span className="text-sm font-medium text-indigo-600">
                {user?.firstName}
              </span>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
