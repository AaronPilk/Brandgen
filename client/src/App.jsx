import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { getApiStatus, getMe } from './services/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import BudgetGate from './pages/BudgetGate';
import ModeSelect from './pages/ModeSelect';
import LeadGenIntake from './pages/LeadGenIntake';
import BrandIntake from './pages/BrandIntake';
import Dashboard from './pages/Dashboard';
import ApiSettings from './pages/ApiSettings';
import ProfilesList from './pages/ProfilesList';
import Connections from './pages/Connections';
import CRM from './pages/CRM';

export default function App() {
  const { setApiStatus, budgetSet, theme, user, token, setAuth, logout } = useStore();

  // Sync theme class on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Validate stored token on mount
  useEffect(() => {
    if (token) {
      getMe().then((u) => setAuth(u, token)).catch(() => logout());
    }
  }, []);

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(console.error);
  }, []);

  // Not logged in — show login
  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={budgetSet ? <ModeSelect /> : <BudgetGate />} />
          <Route path="/lead-gen" element={<LeadGenIntake />} />
          <Route path="/build-brand" element={<BrandIntake />} />
          <Route path="/dashboard/:id" element={<Dashboard />} />
          <Route path="/crm/:id" element={<CRM />} />
          <Route path="/settings" element={<ApiSettings />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/profiles" element={<ProfilesList />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
