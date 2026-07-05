import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import BeneficiaryDetails from './pages/BeneficiaryDetails';
import BeneficiaryForm from './pages/BeneficiaryForm';
import BeneficiaryImport from './pages/BeneficiaryImport';
import PaymentOperations from './pages/PaymentOperations';
import PaymentOperationDetails from './pages/PaymentOperationDetails';
import PaymentOperationForm from './pages/PaymentOperationForm';
import PaymentOperationBeneficiaries from './pages/PaymentOperationBeneficiaries';
import PaymentOperationBeneficiaryManagement from './pages/PaymentOperationBeneficiaryManagement';
import Payments from './pages/Payments';
import Agents from './pages/Agents';
import Anomalies from './pages/Anomalies';
import AuditLogs from './pages/AuditLogs';
import Programs from './pages/Programs';
import ProgramForm from './pages/ProgramForm';
import Operators from './pages/Operators';
import Users from './pages/Users';
import Reports from './pages/Reports';
import RequirePermission from './components/RequirePermission';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/programmes" element={<Programs />} />
        <Route
          path="/programmes/nouveau"
          element={
            <RequirePermission permission="programs.create">
              <ProgramForm />
            </RequirePermission>
          }
        />
        <Route
          path="/programmes/:id/modifier"
          element={
            <RequirePermission permission="programs.update">
              <ProgramForm />
            </RequirePermission>
          }
        />
        <Route path="/operateurs" element={<Operators />} />
        <Route
          path="/utilisateurs"
          element={
            <RequirePermission permission="users.read">
              <Users />
            </RequirePermission>
          }
        />
        <Route path="/beneficiaires" element={<Beneficiaries />} />
        <Route
          path="/beneficiaires/import"
          element={
            <RequirePermission permission="beneficiaries.import">
              <BeneficiaryImport />
            </RequirePermission>
          }
        />
        <Route path="/beneficiaires/nouveau" element={<BeneficiaryForm />} />
        <Route path="/beneficiaires/:id/modifier" element={<BeneficiaryForm />} />
        <Route path="/beneficiaires/:id" element={<BeneficiaryDetails />} />
        <Route path="/operations" element={<PaymentOperations />} />
        <Route path="/operations/nouvelle" element={<PaymentOperationForm />} />
        <Route path="/operations/:id/modifier" element={<PaymentOperationForm />} />
        <Route path="/operations/:id/beneficiaires/gestion" element={<PaymentOperationBeneficiaryManagement />} />
        <Route path="/operations/:id/beneficiaires" element={<PaymentOperationBeneficiaries />} />
        <Route path="/operations/:id" element={<PaymentOperationDetails />} />
        <Route path="/paiements" element={<Payments />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/anomalies" element={<Anomalies />} />
        <Route path="/audit" element={<AuditLogs />} />
        <Route path="/rapports" element={<Reports />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
