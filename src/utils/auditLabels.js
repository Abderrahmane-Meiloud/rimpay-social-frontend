const ACTION_LABELS = {
  'beneficiary.create': 'Création de bénéficiaire',
  'beneficiary.update': 'Modification de bénéficiaire',
  'beneficiary.delete': 'Suppression de bénéficiaire',
  'beneficiary.demo_create': 'Création de bénéficiaire (démo)',
  'payment.create': 'Création de paiement',
  'payment.cancel': 'Annulation de paiement',
  'payment.generate': 'Génération de paiements',
  'payment.validate.accepted': 'Validation de paiement acceptée',
  'payment.validate.rejected': 'Validation de paiement rejetée',
  'payment.validate.conflict': 'Conflit de validation de paiement',
  'payment.demo_generate': 'Génération de paiements (démo)',
  'payment.demo_validate': 'Validation de paiement (démo)',
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
  'operation.demo_create': 'Création d\'opération (démo)',
  'anomaly.resolve': 'Résolution d\'anomalie',
  'anomaly.reopen': 'Réouverture d\'anomalie',
  'anomaly.demo_detect': 'Détection d\'anomalie (démo)',
  'agent.create': 'Création d\'agent',
  'agent.update': 'Modification d\'agent',
  'agent.demo_create': 'Création d\'agent (démo)',
  'device.create': 'Création de dispositif',
  'device.update': 'Modification de dispositif',
  'device.demo_register': 'Enregistrement de dispositif (démo)',
  'program.create': 'Création de programme',
  'program.update': 'Modification de programme',
  'program.demo_create': 'Création de programme (démo)',
  'report.demo_view': 'Consultation de rapport (démo)',
  'sync.demo_complete': 'Synchronisation complétée (démo)',
  'user.login': 'Connexion',
  'user.logout': 'Déconnexion',
  'ministerial_demo.program_created': 'Création du programme de soutien familial',
  'ministerial_demo.operation_opened': "Ouverture de l'opération de paiement",
  'ministerial_demo.payment_validated': "Validation d'un paiement terrain",
  'ministerial_demo.anomaly_detected': "Détection d'une anomalie GPS",
  'ministerial_demo.operation_closed': "Clôture de l'opération de paiement",
  'ministerial_demo.report_exported': "Export d'un rapport PDF",
  'ministerial_demo.audit_log_viewed': "Consultation du journal d'audit",
  'ministerial_demo.dataset_seeded': 'Initialisation du jeu de données de démonstration',
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
