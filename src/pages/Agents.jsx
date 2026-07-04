import { useState } from 'react';
import { X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { listAgents, getAgent } from '../services/agentsService';
import { mapStatus } from '../utils/statusMap';

function geoLabel(assignment) {
  if (!assignment) return '—';
  return (
    assignment.region?.name ||
    assignment.moughataa?.name ||
    assignment.commune?.name ||
    assignment.locality?.name ||
    '—'
  );
}

function Agents() {
  const { data, loading, error, reload } = useApi(() => listAgents({ limit: 50 }), []);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const handleConsult = async (id) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const result = await getAgent(id);
      setDetail(result);
    } catch (err) {
      setDetailError(err.message || "Erreur lors du chargement de l'agent");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClose = () => {
    setDetail(null);
    setDetailError('');
  };

  const columns = [
    {
      key: 'name',
      header: 'Nom',
      render: (row) => row.user?.fullName || '—',
    },
    { key: 'employeeCode', header: 'Code employé', render: (row) => row.employeeCode || '—' },
    { key: 'phone', header: 'Téléphone', render: (row) => row.phone || '—' },
    {
      key: 'devicesCount',
      header: 'Appareils',
      render: (row) => row.devicesCount ?? 0,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button className="btn btn-secondary btn-sm" onClick={() => handleConsult(row.id)} disabled={detailLoading}>
          Consulter
        </button>
      ),
    },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const agents = data?.data || [];
  const activeAssignment = detail?.geographicAssignments?.find((a) => a.status === 'ACTIVE') || null;

  return (
    <div>
      <PageHeader
        title="Agents terrain"
        subtitle="Suivi de l'activité et de la synchronisation des agents de terrain"
      />

      {(detailLoading || detail || detailError) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              {detail ? (detail.user?.fullName || 'Agent') : 'Chargement...'}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={handleClose}>
              <X size={14} /> Fermer
            </button>
          </div>

          {detailLoading && <LoadingState message="Chargement de l'agent..." />}

          {detailError && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
              {detailError}
            </div>
          )}

          {detail && !detailLoading && (
            <>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14, marginBottom: 16 }}>
                <DetailField label="Code employé" value={detail.employeeCode || '—'} />
                <DetailField label="Statut" value={<StatusBadge status={mapStatus(detail.status)} />} />
                <DetailField label="Téléphone" value={detail.phone || '—'} />
                <DetailField label="Email" value={detail.user?.email || '—'} />
                <DetailField label="Région/zone assignée" value={geoLabel(activeAssignment)} />
                <DetailField
                  label="Opérations affectées"
                  value={`${detail.operationAssignmentSummary?.active ?? 0} active(s) / ${detail.operationAssignmentSummary?.total ?? 0} au total`}
                />
              </dl>

              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Appareils assignés</h3>
              {detail.devices && detail.devices.length > 0 ? (
                <table className="data-table" style={{ fontSize: 13, marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th>Identifiant</th>
                      <th>Modèle</th>
                      <th>Statut</th>
                      <th>Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.devices.map((d) => (
                      <tr key={d.id}>
                        <td>{d.deviceUid}</td>
                        <td>{[d.platform, d.model].filter(Boolean).join(' — ') || '—'}</td>
                        <td><StatusBadge status={mapStatus(d.status)} /></td>
                        <td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('fr-FR') : 'Jamais synchronisé'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                  Aucun appareil enregistré pour cet agent.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {agents.length === 0 ? (
        <EmptyState message="Aucun agent terrain enregistré." />
      ) : (
        <DataTable columns={columns} data={agents} />
      )}
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

export default Agents;
