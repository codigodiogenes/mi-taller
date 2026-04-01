import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Motorcycles from './pages/Motorcycles';
import Repairs from './pages/Repairs';
import Settings from './pages/Settings';
import Invoice from './pages/Invoice';
import Login from './pages/Login';

import ClientDetails from './pages/ClientDetails';
import MotorcycleDetails from './pages/MotorcycleDetails';
import RepairDetails from './pages/RepairDetails';
import Stock from './pages/Stock';
import CapitalSummary from './pages/CapitalSummary';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="motorcycles" element={<Motorcycles />} />
        <Route path="motorcycles/:id" element={<MotorcycleDetails />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="repairs/:id" element={<RepairDetails />} />
        <Route path="stock" element={<Stock />} />
        <Route path="capital" element={<CapitalSummary />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/invoice/:id" element={<Invoice />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
