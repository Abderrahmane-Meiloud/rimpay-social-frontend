import clsx from 'clsx';
import './StatusBadge.css';

const STATUS_LABELS = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
  en_attente: 'En attente',
  paye: 'Payé',
  valide: 'Validé',
  annule: 'Annulé',
  rejete: 'Rejeté',
  conflit: 'Conflit',
  brouillon: 'Brouillon',
  validee: 'Validée',
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  suspendue: 'Suspendue',
  cloturee: 'Clôturée',
  archivee: 'Archivée',
  synchronise: 'Synchronisé',
  en_attente_sync: 'En attente',
  ouvert: 'Ouvert',
  resolu: 'Résolu',
  ignore: 'Ignoré',
  faible: 'Faible',
  moyenne: 'Moyenne',
  elevee: 'Élevée',
  critique: 'Critique',
};

const SUCCESS = ['actif', 'valide', 'paye', 'validee', 'cloturee', 'resolu', 'synchronise'];
const WARNING = ['en_attente', 'moyenne', 'elevee', 'suspendu', 'suspendue', 'en_attente_sync', 'ouverte', 'hors_ligne'];
const DANGER = ['critique', 'conflit', 'rejete', 'annule', 'oui'];
const NEUTRAL = ['inactif', 'brouillon', 'archivee', 'faible', 'ignore', 'non', 'en_cours'];

function getVariant(status) {
  if (SUCCESS.includes(status)) return 'success';
  if (DANGER.includes(status)) return 'danger';
  if (WARNING.includes(status)) return 'warning';
  if (NEUTRAL.includes(status)) return 'neutral';
  return 'neutral';
}

function StatusBadge({ status, label }) {
  const variant = getVariant(status);
  const text = label || STATUS_LABELS[status] || status;

  return <span className={clsx('status-badge', `status-${variant}`)}>{text}</span>;
}

export default StatusBadge;
