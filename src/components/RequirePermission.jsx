import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

// Route-level authorization guard. ProtectedRoute (App.jsx) only checks
// authentication; this additionally checks that the current user holds a
// given permission before rendering an admin-only page (e.g. beneficiary
// import), redirecting to the dashboard otherwise.
function RequirePermission({ permission, children }) {
  const { can } = usePermissions();
  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default RequirePermission;
