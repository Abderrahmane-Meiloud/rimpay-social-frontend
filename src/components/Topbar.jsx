import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const ROLE_LABELS = {
  ADMIN_TAAZOUR: 'Administration TAAZOUR',
  PROGRAMME: 'Gestionnaire de programme',
  OPERATOR: 'Opérateur',
};

const ROLE_PRIORITY = ['ADMIN_TAAZOUR', 'PROGRAMME', 'OPERATOR'];

function getPrimaryRoleLabel(roles) {
  if (!roles || roles.length === 0) return null;
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return ROLE_LABELS[r];
  }
  return roles[0];
}

function Topbar() {
  const { user, roles, logout } = useAuth();

  const roleLabel = getPrimaryRoleLabel(roles);

  return (
    <header className="topbar">
      <div className="topbar-titles">
        <span className="topbar-title">RIMPay Social</span>
        <span className="topbar-subtitle">PNRSCS — Plateforme de Paiement Social</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-user">
          <UserCircle size={22} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span>{user?.fullName || 'Utilisateur'}</span>
            {roleLabel && (
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>{roleLabel}</span>
            )}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout} title="Déconnexion">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
