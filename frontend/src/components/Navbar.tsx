import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck,
  Compass,
  Flag,
  LogOut,
  Map,
  Menu,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './ui/Avatar';
import NotificationBell from './NotificationBell';
import { ButtonLink } from './ui/Button';

// Every destination shows an icon AND a word: an icon alone is a guess for
// someone who does not use apps every day, a word alone is slower to scan.
function NavItem({
  to,
  icon,
  children,
  onClick,
  compact = false,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  // Admin destinations: icon only on a laptop, icon and word on a wide screen.
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      title={compact ? String(children) : undefined}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-bold transition-colors ${
          isActive ? 'bg-primary-surface text-primary-strong' : 'text-text-2 hover:bg-surface-sunken hover:text-text'
        }`
      }
    >
      <span aria-hidden="true">{icon}</span>
      <span className={compact ? 'sr-only xl:not-sr-only' : undefined}>{children}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : '';
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const close = () => setOpen(false);
  const isAdmin = user?.role === 'admin';

  const links = (
    <>
      <NavItem to="/" icon={<Compass size={18} />} onClick={close}>Découvrir</NavItem>
      <NavItem to="/map" icon={<Map size={18} />} onClick={close}>Carte</NavItem>
      {isAuthenticated && (
        <NavItem to="/my-events" icon={<CalendarCheck size={18} />} onClick={close}>Mes sorties</NavItem>
      )}
    </>
  );

  const adminLinks = (compact: boolean) =>
    isAdmin && (
      <>
        <NavItem to="/admin/analytics" icon={<BarChart3 size={18} />} onClick={close} compact={compact}>Statistiques</NavItem>
        <NavItem to="/admin/users" icon={<Users size={18} />} onClick={close} compact={compact}>Membres</NavItem>
        <NavItem to="/admin/events" icon={<ShieldCheck size={18} />} onClick={close} compact={compact}>Modération</NavItem>
        <NavItem to="/admin/reports" icon={<Flag size={18} />} onClick={close} compact={compact}>Signalements</NavItem>
      </>
    );

  const themeButton = (
    <button
      onClick={toggleTheme}
      aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="flex h-11 w-11 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-surface-sunken hover:text-text"
    >
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );

  return (
    <header className="sticky top-0 z-[1100] bg-surface/95 shadow-[0_1px_0_0_var(--color-border)] backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={close} aria-label="PartnR, accueil">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-xl font-black text-on-primary">
            P
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-primary">PartnR</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {links}
          {isAdmin && <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />}
          {adminLinks(true)}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <ButtonLink to="/events/new" size="sm" className="mr-1">
                <Plus size={18} aria-hidden="true" /> Créer une sortie
              </ButtonLink>
              {themeButton}
              <NotificationBell />
              <Link
                to={`/profile/${user?.id}`}
                className="flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-4 transition-colors hover:bg-surface-sunken"
              >
                <Avatar name={user?.firstName ?? '?'} url={user?.avatarUrl} size="sm" />
                <span className="text-[15px] font-bold text-text">{user?.firstName}</span>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="flex h-11 w-11 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-surface-sunken hover:text-text"
              >
                <LogOut size={20} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {themeButton}
              <ButtonLink to="/login" variant="ghost" size="sm">Se connecter</ButtonLink>
              <ButtonLink to="/register" size="sm">Créer un compte</ButtonLink>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-bold text-text-2 hover:bg-surface-sunken"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            Menu
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navigation principale">
            {links}
            {isAuthenticated && (
              <NavItem to="/events/new" icon={<Plus size={18} />} onClick={close}>Créer une sortie</NavItem>
            )}
            {adminLinks(false)}
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            {themeButton}
            {isAuthenticated ? (
              <>
                <Link
                  to={`/profile/${user?.id}`}
                  onClick={close}
                  className="flex min-h-11 items-center gap-2 rounded-full pr-3 text-[15px] font-bold text-text"
                >
                  <Avatar name={user?.firstName ?? '?'} url={user?.avatarUrl} size="sm" />
                  {user?.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-auto flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-bold text-text-3"
                >
                  <LogOut size={18} aria-hidden="true" /> Se déconnecter
                </button>
              </>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">Se connecter</ButtonLink>
                <ButtonLink to="/register" size="sm" className="ml-auto">Créer un compte</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
