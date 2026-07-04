import { useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { listPayments, getPayment } from '../services/paymentsService';
import { formatCurrency } from '../utils/format';
import { mapStatus } from '../utils/statusMap';

function Payments() {
  const { data, loading, error, reload } = useApi(() => listPayments({ limit: 50 }), []);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const handleView = useCallback(async (id) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const d = await getPayment(id);
      setDetail(d);
    } catch (err) {
      setDetailError(err.message || 'Erreur lors du chargement');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const columns = [
    {
      key: 'beneficiary',
      header: 'Bénéficiaire',
      render: (row) => row.beneficiary?.fullName || '—',
    },
    {
      key: 'operation',
      header: 'Opération',
      render: (row) => row.operation?.name || '—',
    },
    {
      key: 'amount',
      header: 'Montant',
      render: (row) => formatCurrency(Number(row.amount || 0)),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    {
      key: 'syncStatus',
      header: 'Sync',
      render: (row) => <StatusBadge status={mapStatus(row.syncStatus)} />,
    },
    {
      key: 'paidAt',
      header: 'Date paiement',
      render: (row) => row.paidAt ? new Date(row.paidAt).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button className="btn btn-secondary btn-sm" onClick={() => handleView(row.id)}>
          <Eye size={13} /> Voir
        </button>
      ),
    },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Registre des transactions de paiement social"
      />

      {detailLoading && <LoadingState message="Chargement du détail..." />}
      {detailError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', color: '#991b1b', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13 }}>
            {detailError}
          </div>
        </div>
      )}

      {detail && !detailLoading && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Détail du paiement</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>Fermer</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Bénéficiaire</span>
              <span style={{ fontSize: 14 }}>{detail.beneficiary?.fullName || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Opération</span>
              <span style={{ fontSize: 14 }}>{detail.operation?.name || '—'} ({detail.operation?.code || '—'})</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Montant</span>
              <span style={{ fontSize: 14 }}>{formatCurrency(Number(detail.amount || 0))}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Statut</span>
              <StatusBadge status={mapStatus(detail.status)} />
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Programme</span>
              <span style={{ fontSize: 14 }}>{detail.socialProgram?.name || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Région</span>
              <span style={{ fontSize: 14 }}>{detail.geography?.region?.name || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Localité</span>
              <span style={{ fontSize: 14 }}>{detail.geography?.locality?.name || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Date de création</span>
              <span style={{ fontSize: 14 }}>{new Date(detail.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            {detail.paidAt && (
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Date de paiement</span>
                <span style={{ fontSize: 14 }}>{new Date(detail.paidAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
            {detail.cancelledAt && (
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Date d'annulation</span>
                <span style={{ fontSize: 14 }}>{new Date(detail.cancelledAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>

          {detail.recentStatusHistory && detail.recentStatusHistory.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Historique de statut</h3>
              <table className="data-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>De</th>
                    <th>Vers</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recentStatusHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.createdAt).toLocaleString('fr-FR')}</td>
                      <td>{h.fromStatus ? <StatusBadge status={mapStatus(h.fromStatus)} /> : '—'}</td>
                      <td><StatusBadge status={mapStatus(h.toStatus)} /></td>
                      <td>{h.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {detail.validationSummary && detail.validationSummary.total > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Résumé de validation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Tentatives</span>
                  <span>{detail.validationSummary.attempted}</span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Acceptées</span>
                  <span>{detail.validationSummary.accepted}</span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Rejetées</span>
                  <span>{detail.validationSummary.rejected}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <DataTable columns={columns} data={data?.data || []} />
    </div>
  );
}

export default Payments;
