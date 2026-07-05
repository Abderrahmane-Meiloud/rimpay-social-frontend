import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Power, PowerOff, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { listOperators, createOperator, updateOperatorStatus } from '../services/operatorsService';
import { mapStatus } from '../utils/statusMap';
import './Operators.css';

const EMPTY_FORM = {
  name: '',
  code: '',
  type: '',
  legalName: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

function Operators() {
  const { can } = usePermissions();
  const { data, loading, error, reload } = useApi(() => listOperators({ limit: 50 }), []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusError, setStatusError] = useState('');

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.code.trim()) {
      setFormError('Le nom et le code sont obligatoires.');
      return;
    }

    const payload = { name: form.name.trim(), code: form.code.trim() };
    if (form.type.trim()) payload.type = form.type.trim();
    if (form.legalName.trim()) payload.legalName = form.legalName.trim();
    if (form.contactName.trim()) payload.contactName = form.contactName.trim();
    if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim();
    if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim();

    setSubmitting(true);
    try {
      await createOperator(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err.message || "Erreur lors de la création de l'opérateur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(operator) {
    const nextStatus = operator.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusError('');
    setStatusUpdatingId(operator.id);
    try {
      await updateOperatorStatus(operator.id, nextStatus);
      reload();
    } catch (err) {
      setStatusError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const columns = [
    { key: 'name', header: 'Opérateur' },
    { key: 'code', header: 'Code' },
    { key: 'type', header: 'Type', render: (row) => row.type || '—' },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    { key: 'agentsCount', header: 'Agents', render: (row) => row.agentsCount ?? 0 },
    {
      key: 'paymentOperationsCount',
      header: 'Opérations liées',
      render: (row) => row.paymentOperationsCount ?? 0,
    },
    ...(can('operators.manage_status') || can('users.create')
      ? [{
          key: 'actions',
          header: 'Actions',
          render: (row) => (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {can('operators.manage_status') && (
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={statusUpdatingId === row.id || row.status === 'SUSPENDED'}
                  onClick={() => handleToggleStatus(row)}
                  title={row.status === 'SUSPENDED' ? 'Opérateur suspendu — modification indisponible ici' : undefined}
                >
                  {row.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
                  {row.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                </button>
              )}
              {can('users.create') && row.status === 'ACTIVE' && (
                <Link
                  to="/utilisateurs"
                  state={{ createAccountFor: 'operator', operatorId: row.id }}
                  className="btn btn-secondary btn-sm"
                >
                  <UserPlus size={14} /> Créer un compte opérateur
                </Link>
              )}
            </div>
          ),
        }]
      : []),
  ];

  if (loading) return <LoadingState message="Chargement des opérateurs..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const operators = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Opérateurs de paiement"
        subtitle="Opérateurs de distribution contractés — accès et statut gérés par l'administration TAAZOUR"
        actions={can('operators.create') ? (
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Nouvel opérateur'}
          </button>
        ) : null}
      />

      {statusError && (
        <div className="form-error-banner">{statusError}</div>
      )}

      {showForm && can('operators.create') && (
        <form className="card operator-form" onSubmit={handleCreate} style={{ marginBottom: 16 }}>
          {formError && <div className="form-error-banner">{formError}</div>}
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Nom <span className="form-required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom de l'opérateur"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Code <span className="form-required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Code unique, ex: OP-NORD-01"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Type</label>
              <input
                type="text"
                className="form-input"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                placeholder="ex: DISTRIBUTION"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Raison sociale</label>
              <input
                type="text"
                className="form-input"
                value={form.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nom du contact</label>
              <input
                type="text"
                className="form-input"
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Téléphone du contact</label>
              <input
                type="text"
                className="form-input"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Email du contact</label>
              <input
                type="email"
                className="form-input"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Création...' : "Créer l'opérateur"}
            </button>
          </div>
        </form>
      )}

      {operators.length === 0 ? (
        <EmptyState message="Aucun opérateur enregistré." />
      ) : (
        <DataTable columns={columns} data={operators} />
      )}
    </div>
  );
}

export default Operators;
