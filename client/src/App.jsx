import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { getApiStatus } from './services/api';
import Layout from './components/Layout';
import BudgetGate from './pages/BudgetGate';
import ModeSelect from './pages/ModeSelect';
import LeadGenIntake from './pages/LeadGenIntake';
import BrandIntake from './pages/BrandIntake';
import Dashboard from './pages/Dashboard';
import ApiSettings from './pages/ApiSettings';
import ProfilesList from './pages/ProfilesList';

export default function App() {
  const { setApiStatus, budgetSet, theme } = useStore();

  // Sync theme class on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(console.error);
  }, []);

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={budgetSet ? <ModeSelect /> : <BudgetGate />} />
          <Route path="/lead-gen" element={<LeadGenIntake />} />
          <Route path="/build-brand" element={<BrandIntake />} />
          <Route path="/dashboard/:id" element={<Dashboard />} />
          <Route path="/settings" element={<ApiSettings />} />
          <Route path="/profiles" element={<ProfilesList />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
