import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';
import { ButtonLink } from './ui/Button';

function NavItem({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-coral-50 text-coral-700' : 'text-ink-mid hover:bg-cream-deep hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const close = () => setOpen(false);

  const links = (
    <>
      <NavItem to="/" onClick={close}>Événements</NavItem>
      <NavItem to="/map" onClick={close}>Carte</NavItem>
      {isAuthenticated && <NavItem to="/my-events" onClick={close}>Mes événements</NavItem>}
      {isAuthenticated && <NavItem to="/events/new" onClick={close}>Créer</NavItem>}
      {user?.role === 'admin' && (
        <>
          <NavItem to="/admin/analytics" onClick={close}>Analytics</NavItem>
          <NavItem to="/admin/users" onClick={close}>Utilisateurs</NavItem>
          <NavItem to="/admin/events" onClick={close}>Modération</NavItem>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-[1100] border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={close}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-violet-500 text-sm font-bold text-white">
            P
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">PartnR</span>
        </Link>

        <div className="ml-6 hidden items-center gap-1 md:flex">{links}</div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                to={`/profile/${user?.id}`}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-cream-deep"
              >
                <Avatar name={user?.firstName ?? '?'} url={user?.avatarUrl} size="sm" />
                <span className="text-sm font-semibold text-ink">{user?.firstName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-ink-sub transition-colors hover:text-ink"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-mid hover:text-ink">
                Connexion
              </Link>
              <ButtonLink to="/register" size="sm">Inscription</ButtonLink>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:bg-cream-deep md:hidden"
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </>
            ) : (
              <>
                <line x1="2" y1="5" x2="16" y2="5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13" x2="16" y2="13" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          {links}
          <div className="mt-2 flex items-center gap-3 border-t border-line pt-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={`/profile/${user?.id}`}
                  onClick={close}
                  className="flex items-center gap-2 text-sm font-semibold text-ink"
                >
                  <Avatar name={user?.firstName ?? '?'} url={user?.avatarUrl} size="sm" />
                  {user?.firstName}
                </Link>
                <button onClick={handleLogout} className="ml-auto text-sm text-ink-sub">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className="text-sm font-medium text-ink-mid">
                  Connexion
                </Link>
                <ButtonLink to="/register" size="sm" className="ml-auto">Inscription</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
