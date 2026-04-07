import { Link, useLocation } from 'react-router-dom';
import { Settings, FolderOpen, Zap, Sun, Moon, ArrowRight, Plug, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import CostTracker from './CostTracker';

export default function Layout({ children }) {
  const { theme, toggleTheme, currentProfile, user, logout } = useStore();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-surface-bg transition-colors duration-500">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-purple/[0.03] dark:bg-brand-purple/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glossy-nav transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="text-[15px] font-bold tracking-tight text-content-primary">
              Brand<span className="text-brand-purple">Gen</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <CostTracker />

            {currentProfile && (
              <Link
                to={`/dashboard/${currentProfile.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple text-[12px] font-semibold hover:bg-brand-purple/20 transition-colors"
              >
                Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            <NavButton onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </NavButton>
            <NavLink to="/connections" title="Connections">
              <Plug className="w-[18px] h-[18px]" />
            </NavLink>
            <NavLink to="/profiles" title="Profiles">
              <FolderOpen className="w-[18px] h-[18px]" />
            </NavLink>
            <NavLink to="/settings" title="Settings">
              <Settings className="w-[18px] h-[18px]" />
            </NavLink>
            <NavButton onClick={logout} title="Sign out">
              <LogOut className="w-[18px] h-[18px]" />
            </NavButton>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-14 min-h-screen">
        <div className={`mx-auto px-6 ${isHome ? 'max-w-5xl' : 'max-w-3xl'} py-12`}>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavButton({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-content-muted hover:text-content-primary hover:bg-surface-raised transition-all duration-200"
    >
      {children}
    </button>
  );
}

function NavLink({ children, to, title }) {
  return (
    <Link
      to={to}
      title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-content-muted hover:text-content-primary hover:bg-surface-raised transition-all duration-200"
    >
      {children}
    </Link>
  );
}
