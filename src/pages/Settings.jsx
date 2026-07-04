import { ShieldCheck, Users, ListChecks, RefreshCw, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import './Settings.css';

const SECTIONS = [
  {
    id: 'roles',
    icon: Users,
    title: 'Rôles',
    description: 'Gestion des rôles utilisateurs : administrateur, superviseur, agent terrain.',
  },
  {
    id: 'permissions',
    icon: ShieldCheck,
    title: 'Permissions',
    description: "Définition des droits d'accès par module et par rôle.",
  },
  {
    id: 'statuts',
    icon: ListChecks,
    title: 'Statuts',
    description: 'Configuration des statuts des opérations, paiements et bénéficiaires.',
  },
  {
    id: 'sync',
    icon: RefreshCw,
    title: 'Synchronisation',
    description: 'Paramètres de synchronisation des données terrain et fréquence.',
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Sécurité',
    description: "Politique de mots de passe, authentification et journalisation.",
  },
];

function Settings() {
  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration générale de la plateforme — disponible en phase backend"
      />

      <div className="grid grid-3">
        {SECTIONS.map((section) => (
          <div className="card settings-card" key={section.id}>
            <div className="settings-icon">
              <section.icon size={20} />
            </div>
            <h2 className="card-title">{section.title}</h2>
            <p className="settings-description">{section.description}</p>
            <span className="settings-badge">Phase backend</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;
