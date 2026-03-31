import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from './lib/auth-client';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import { PropertyProvider } from './components/PropertySwitcher';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import ChecklistsPage from './pages/ChecklistsPage';
import IssuesPage from './pages/IssuesPage';
import SuperhostPage from './pages/SuperhostPage';
import CleanersPage from './pages/CleanersPage';
import StandardsPage from './pages/StandardsPage';
import PropertiesPage from './pages/PropertiesPage';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  if (isPending) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  return session?.user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <PropertyProvider>
                  <Layout />
                </PropertyProvider>
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="checklists" element={<ChecklistsPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="superhost" element={<SuperhostPage />} />
            <Route path="cleaners" element={<CleanersPage />} />
            <Route path="standards" element={<StandardsPage />} />
            <Route path="properties" element={<PropertiesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
