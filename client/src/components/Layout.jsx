import { Link } from 'react-router-dom';
import { Settings, FolderOpen, Zap, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import CostTracker from './CostTracker';

export default function Layout({ children }) {
  const { theme, toggleTheme } = useStore();

  return (
    <div className="min-h-screen bg-surface-bg transition-colors duration-300">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-bg/80 backdrop-blur-xl border-b border-surface-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-purple" />
            <span className="text-xl font-bold tracking-tight text-content-primary">
              Brand<span className="text-brand-purple">Gen</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <CostTracker />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface-raised transition-colors text-content-secondary hover:text-content-primary"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              to="/profiles"
              className="p-2 rounded-lg hover:bg-surface-raised transition-colors text-content-secondary hover:text-content-primary"
            >
              <FolderOpen className="w-5 h-5" />
            </Link>
            <Link
              to="/settings"
              className="p-2 rounded-lg hover:bg-surface-raised transition-colors text-content-secondary hover:text-content-primary"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
