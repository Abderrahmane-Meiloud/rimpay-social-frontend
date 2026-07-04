import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  UserCog,
  AlertTriangle,
  ClipboardList,
  FileBarChart,
  BookOpen,
} from 'lucide-react';
import GovernmentLogo from './GovernmentLogo';
import { usePermissions } from '../hooks/usePermissions';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true, permission: 'reports.read' },
  { to: '/beneficiaires', label: 'Bénéficiaires', icon: Users, permission: 'beneficiaries.read' },
  { to: '/programmes', label: 'Programmes sociaux', icon: BookOpen, permission: 'programs.read' },
  { to: '/operations', label: 'Opérations de paiement', icon: Wallet, permission: 'operations.read' },
  { to: '/paiements', label: 'Paiements', icon: Receipt, permission: 'payments.read' },
  { to: '/agents', label: 'Agents terrain', icon: UserCog, permission: 'agents.read' },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle, permission: 'anomalies.read' },
  { to: '/audit', label: 'Audit', icon: ClipboardList, permission: 'audit.read' },
  { to: '/rapports', label: 'Rapports', icon: FileBarChart, permission: 'reports.read' },
];

function Sidebar() {
  const { can } = usePermissions();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <GovernmentLogo size={40} />
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">RIMPay Social</span>
          <span className="sidebar-brand-subtitle">PNRSCS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter((item) => can(item.permission)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'sidebar-link-active')}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
