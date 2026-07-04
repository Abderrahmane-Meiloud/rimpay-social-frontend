const STATUS_MAP = {
  ACTIVE: 'actif',
  INACTIVE: 'inactif',
  SUSPENDED: 'suspendu',
  DECEASED: 'inactif',
  MOVED: 'inactif',
  UNDER_REVIEW: 'en_attente',
  PENDING: 'en_attente',
  VALIDATED: 'valide',
  PAID: 'paye',
  CANCELLED: 'annule',
  REJECTED: 'rejete',
  CONFLICT: 'conflit',
  DRAFT: 'brouillon',
  OPEN: 'ouverte',
  IN_PROGRESS: 'en_cours',
  CLOSED: 'cloturee',
  ARCHIVED: 'archivee',
  BLOCKED: 'suspendu',
  NOT_SYNCED: 'en_attente_sync',
  SYNCED: 'synchronise',
  RECEIVED: 'en_attente',
  PROCESSING: 'en_cours',
  COMPLETED: 'valide',
  PARTIAL_FAILED: 'conflit',
  FAILED: 'rejete',
  ACCEPTED: 'valide',
  INCLUDED: 'actif',
  EXCLUDED: 'inactif',
  PENDING_REVIEW: 'en_attente',
  REMOVED: 'annule',
  IN_REVIEW: 'en_attente',
  RESOLVED: 'resolu',
  DISMISSED: 'ignore',
  LOW: 'faible',
  MEDIUM: 'moyenne',
  HIGH: 'elevee',
  CRITICAL: 'critique',
};

export function mapStatus(backendStatus) {
  if (!backendStatus) return 'inactif';
  return STATUS_MAP[backendStatus] || backendStatus.toLowerCase();
}

const ANOMALY_TYPE_LABELS = {
  DUPLICATE_NNI: 'Doublon NNI',
  DUPLICATE_PHONE: 'Doublon téléphone',
  MULTIPLE_PAYMENT: 'Paiement multiple',
  PAYMENT_ALREADY_VALIDATED: 'Paiement déjà validé',
  MISSING_GPS: 'GPS manquant',
  GPS_OUT_OF_ZONE: 'GPS hors zone',
  SYNC_CONFLICT: 'Conflit synchronisation',
  UNKNOWN_DEVICE: 'Appareil inconnu',
  AGENT_NOT_ASSIGNED: 'Agent non affecté',
  BENEFICIARY_MODIFIED_AFTER_PAYMENT: 'Bénéficiaire modifié après paiement',
};

export function mapAnomalyType(type) {
  return ANOMALY_TYPE_LABELS[type] || type;
}
