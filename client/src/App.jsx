import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { getApiStatus, getMe, listProfiles } from './services/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import BudgetGate from './pages/BudgetGate';
import ModeSelect from './pages/ModeSelect';
import LeadGenIntake from './pages/LeadGenIntake';
import BrandIntake from './pages/BrandIntake';
import Dashboard from './pages/Dashboard';
import ApiSettings from './pages/ApiSettings';
import ProfilesList from './pages/ProfilesList';

import CRM from './pages/CRM';
import Team from './pages/Team';
import Usage from './pages/Usage';
import DevChat from './pages/DevChat';

// Client redirect — finds their assigned profile and sends them there
function ClientRedirect() {
  const { user } = useStore();
  useEffect(() => {
    if (user?.role === 'client') {
      listProfiles().then(profiles => {
        if (profiles.length === 1) {
          window.location.href = `/dashboard/${profiles[0].id}`;
        } else if (profiles.length > 1) {
          window.location.href = '/profiles';
        }
      }).catch(() => {});
    }
  }, []);
  return <div className="flex items-center justify-center min-h-[60vh] text-content-muted text-sm">Loading your workspace...</div>;
}

export default function App() {
  const { setApiStatus, budgetSet, theme, user, token, setAuth, logout } = useStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  useEffect(() => {
    if (token) {
      getMe().then((u) => setAuth(u, token)).catch(() => logout());
    }
  }, []);

  useEffect(() => {
    getApiStatus().then(setApiStatus).catch(console.error);
  }, []);

  if (!user) return <Login />;

  const isClient = user.role === 'client';
  const isAdmin = user.role === 'admin';

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Client gets redirected to their profile */}
          <Route path="/" element={isClient ? <ClientRedirect /> : (budgetSet ? <ModeSelect /> : <BudgetGate />)} />

          {/* Profile creation — not for clients */}
          {!isClient && <Route path="/lead-gen" element={<LeadGenIntake />} />}
          {!isClient && <Route path="/build-brand" element={<BrandIntake />} />}

          {/* These are accessible to all roles with access control on backend */}
          <Route path="/dashboard/:id" element={<Dashboard />} />
          <Route path="/crm/:id" element={<CRM />} />
          <Route path="/profiles" element={<ProfilesList />} />

          {/* Admin/manager only */}
          {!isClient && <Route path="/settings" element={<ApiSettings />} />}
          {!isClient && <Route path="/team" element={<Team />} />}
          {isAdmin && <Route path="/usage" element={<Usage />} />}
          {isAdmin && <Route path="/internal/dev-chat" element={<DevChat />} />}

          {/* Catch-all for clients trying to access restricted pages */}
          {isClient && <Route path="*" element={<Navigate to="/" />} />}
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
