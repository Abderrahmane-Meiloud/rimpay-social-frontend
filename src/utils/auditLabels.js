const ACTION_LABELS = {
  'beneficiary.create': 'Création de bénéficiaire',
  'beneficiary.update': 'Modification de bénéficiaire',
  'beneficiary.delete': 'Suppression de bénéficiaire',
  'payment.create': 'Création de paiement',
  'payment.cancel': 'Annulation de paiement',
  'payment.generate': 'Génération de paiements',
  'payment.validate.accepted': 'Validation de paiement acceptée',
  'payment.validate.rejected': 'Validation de paiement rejetée',
  'payment.validate.conflict': 'Conflit de validation de paiement',
  'operation.create': 'Création d\'opération',
  'operation.update': 'Modification d\'opération',
  'operation.transition': 'Transition de statut d\'opération',
  'operation.status_transition': 'Transition de statut d\'opération',
  'operation.open': 'Ouverture d\'opération',
  'operation.close': 'Clôture d\'opération',
  'operation.assign_beneficiary': 'Affectation de bénéficiaire',
  'operation.assign_beneficiaries': 'Affectation de bénéficiaires',
  'operation.exclude_beneficiary': 'Exclusion de bénéficiaire',
  'operation.reinclude_beneficiary': 'Réinclusion de bénéficiaire',
  'operation.assign_agent': 'Affectation d\'agent',
  'operation.remove_agent': 'Retrait d\'agent',
  'operation.generate_payments': 'Génération de paiements',
  'anomaly.resolve': 'Résolution d\'anomalie',
  'anomaly.reopen': 'Réouverture d\'anomalie',
  'agent.create': 'Création d\'agent',
  'agent.update': 'Modification d\'agent',
  'device.create': 'Création de dispositif',
  'device.update': 'Modification de dispositif',
  'program.create': 'Création de programme',
  'program.update': 'Modification de programme',
  'user.login': 'Connexion',
  'user.logout': 'Déconnexion',
};

const ENTITY_LABELS = {
  Payment: 'Paiement',
  PaymentOperation: 'Opération de paiement',
  Beneficiary: 'Bénéficiaire',
  Agent: 'Agent',
  Device: 'Dispositif',
  SocialProgram: 'Programme social',
  Anomaly: 'Anomalie',
  User: 'Utilisateur',
};

const SOURCE_LABELS = {
  SYSTEM: 'Système',
  WEB: 'Interface web',
  MOBILE: 'Application mobile',
  API: 'API',
};

export function formatActionLabel(action) {
  return ACTION_LABELS[action] || 'Action enregistrée';
}

export function formatEntityType(type) {
  return ENTITY_LABELS[type] || type;
}

export function formatSource(source) {
  return SOURCE_LABELS[source] || source;
}
