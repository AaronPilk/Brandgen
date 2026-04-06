import { Link } from 'react-router-dom';
import { Settings, FolderOpen, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import CostTracker from './CostTracker';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-dark-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-purple" />
            <span className="text-xl font-bold tracking-tight">
              Brand<span className="text-brand-purple">Gen</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <CostTracker />
            <Link
              to="/profiles"
              className="p-2 rounded-lg hover:bg-brand-dark-surface transition-colors text-gray-400 hover:text-white"
            >
              <FolderOpen className="w-5 h-5" />
            </Link>
            <Link
              to="/settings"
              className="p-2 rounded-lg hover:bg-brand-dark-surface transition-colors text-gray-400 hover:text-white"
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
