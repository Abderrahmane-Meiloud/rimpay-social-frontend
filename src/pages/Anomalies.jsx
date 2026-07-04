import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { listAnomalies, getAnomaly, resolveAnomaly, reopenAnomaly } from '../services/anomaliesService';
import { formatCurrency } from '../utils/format';
import { mapStatus, mapAnomalyType } from '../utils/statusMap';

function InlinePrompt({ label, placeholder, onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, width: 180 }}
        autoFocus
      />
      <button className="btn btn-primary btn-sm" onClick={() => onSubmit(value)} style={{ fontSize: 11, padding: '3px 8px' }}>
        {label}
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onCancel} style={{ fontSize: 11, padding: '3px 8px' }}>
        Annuler
      </button>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>{label}</dt>
      <dd style={{ margin: 0, color: '#111827' }}>{value}</dd>
    </div>
  );
}

function Anomalies() {
  const { can } = usePermissions();
  const { data, loading, error, reload } = useApi(() => listAnomalies({ limit: 50 }), []);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [promptState, setPromptState] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const canResolve = can('anomalies.resolve');

  const handleResolve = async (id, notes) => {
    setPromptState(null);
    setActionLoading(id);
    setActionError(null);
    try {
      await resolveAnomaly(id, notes);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopen = async (id, reason) => {
    setPromptState(null);
    setActionLoading(id);
    setActionError(null);
    try {
      await reopenAnomaly(id, reason);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (id) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const result = await getAnomaly(id);
      setDetail(result);
    } catch (err) {
      setDetailError(err.message || "Erreur lors du chargement de l'anomalie");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (row) => mapAnomalyType(row.type),
    },
    {
      key: 'severity',
      header: 'Sévérité',
      render: (row) => <StatusBadge status={mapStatus(row.severity)} />,
    },
    { key: 'entityType', header: 'Entité' },
    { key: 'description', header: 'Description', wrap: true },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    {
      key: 'detectedAt',
      header: 'Date',
      render: (row) => row.detectedAt ? new Date(row.detectedAt).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (actionLoading === row.id) return <span style={{ fontSize: 12, color: '#6B7280' }}>...</span>;
        if (promptState?.id === row.id) {
          return (
            <InlinePrompt
              label={promptState.type === 'resolve' ? 'Résoudre' : 'Rouvrir'}
              placeholder={promptState.type === 'resolve' ? 'Notes de résolution...' : 'Raison de réouverture...'}
              onSubmit={(val) =>
                promptState.type === 'resolve' ? handleResolve(row.id, val) : handleReopen(row.id, val)
              }
              onCancel={() => setPromptState(null)}
            />
          );
        }
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row.id)}>
              <Eye size={13} /> Détail
            </button>
            {canResolve && (row.status === 'OPEN' || row.status === 'IN_REVIEW') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setPromptState({ id: row.id, type: 'resolve' })}>
                Résoudre
              </button>
            )}
            {canResolve && (row.status === 'RESOLVED' || row.status === 'DISMISSED') && (
              <button className="btn btn-secondary btn-sm" onClick={() => setPromptState({ id: row.id, type: 'reopen' })}>
                Rouvrir
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const anomalies = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Anomalies"
        subtitle="Centre de contrôle des risques et de la qualité des données"
      />
      {actionError && (
        <div style={{ marginBottom: 12, padding: '10px 16px', fontSize: 13, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 600, fontSize: 13 }}>✕</button>
        </div>
      )}

      {(detailLoading || detail || detailError) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              {detail ? mapAnomalyType(detail.type) : 'Chargement...'}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => { setDetail(null); setDetailError(''); }}>
              <X size={14} /> Fermer
            </button>
          </div>

          {detailLoading && <LoadingState message="Chargement de l'anomalie..." />}

          {detailError && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
              {detailError}
            </div>
          )}

          {detail && !detailLoading && (
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
              <DetailField label="Sévérité" value={<StatusBadge status={mapStatus(detail.severity)} />} />
              <DetailField label="Statut" value={<StatusBadge status={mapStatus(detail.status)} />} />
              <DetailField label="Détectée le" value={new Date(detail.detectedAt).toLocaleString('fr-FR')} />
              <DetailField label="Type d'entité" value={detail.entityType} />
              {detail.beneficiary && (
                <DetailField label="Bénéficiaire concerné" value={`${detail.beneficiary.fullName} (${detail.beneficiary.registryCode})`} />
              )}
              {detail.payment && (
                <DetailField
                  label="Paiement concerné"
                  value={`${formatCurrency(Number(detail.payment.amount || 0))} — ${detail.payment.status}`}
                />
              )}
              {detail.paymentOperation && (
                <DetailField label="Opération concernée" value={detail.paymentOperation.name} />
              )}
              {detail.agent && (
                <DetailField label="Agent concerné" value={`${detail.agent.fullName} (${detail.agent.status})`} />
              )}
              {detail.device && (
                <DetailField label="Terminal concerné" value={`${detail.device.deviceUid} (${detail.device.status})`} />
              )}
              {detail.resolutionNotes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <dt style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>Notes de résolution</dt>
                  <dd style={{ margin: 0, color: '#111827' }}>{detail.resolutionNotes}</dd>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <dt style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>Description</dt>
                <dd style={{ margin: 0, color: '#111827' }}>{detail.description || '—'}</dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {anomalies.length === 0 ? (
        <EmptyState message="Aucune anomalie détectée." />
      ) : (
        <DataTable columns={columns} data={anomalies} />
      )}
    </div>
  );
}

export default Anomalies;
