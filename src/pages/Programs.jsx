import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, FileBarChart, Star, Plus, Edit, UserPlus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { listPrograms, getProgram } from '../services/programsService';
import { listOperations } from '../services/operationsService';
import { formatCurrency, formatNumber } from '../utils/format';
import { mapStatus } from '../utils/statusMap';

// The M1 ministerial demo dataset seeds exactly one flagship programme
// under this code. It is visually highlighted so a presenter can find it
// immediately, without hardcoding any beneficiary or payment data.
const DEMO_PROGRAM_CODE = 'MDEMO-PNSF';

function Programs() {
  const { can } = usePermissions();
  const { data, loading, error, reload } = useApi(() => listPrograms({ limit: 50 }), []);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [programOperations, setProgramOperations] = useState(null);

  const handleConsult = async (id) => {
    setDetail(null);
    setDetailError('');
    setProgramOperations(null);
    setDetailLoading(true);
    try {
      const [result, operationsResult] = await Promise.all([
        getProgram(id),
        listOperations({ socialProgramId: id, limit: 100 }),
      ]);
      setDetail(result);
      setProgramOperations(operationsResult?.data || []);
    } catch (err) {
      setDetailError(err.message || 'Erreur lors du chargement du programme');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClose = () => {
    setDetail(null);
    setDetailError('');
    setProgramOperations(null);
  };

  if (loading) return <LoadingState message="Chargement des programmes sociaux..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const programs = data?.data || [];

  const columns = [
    {
      key: 'name',
      header: 'Programme',
      wrap: true,
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {row.code === DEMO_PROGRAM_CODE && (
            <Star size={14} color="var(--green-primary)" fill="var(--green-primary)" />
          )}
          {row.name}
        </span>
      ),
    },
    { key: 'code', header: 'Code' },
    { key: 'type', header: 'Type', render: (row) => row.type || '—' },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    {
      key: 'startDate',
      header: 'Début',
      render: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'endDate',
      header: 'Fin',
      render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('fr-FR') : '—',
    },
    {
      key: 'operationsCount',
      header: 'Opérations',
      render: (row) => row.operationsCount ?? 0,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleConsult(row.id)}
            disabled={detailLoading}
          >
            Consulter
          </button>
          {can('programs.update') && (
            <Link to={`/programmes/${row.id}/modifier`} className="btn btn-secondary btn-sm">
              <Edit size={14} /> Modifier
            </Link>
          )}
          {can('users.create') && (
            <Link
              to="/utilisateurs"
              state={{ createAccountFor: 'programme', programId: row.id }}
              className="btn btn-secondary btn-sm"
            >
              <UserPlus size={14} /> Créer un compte programme
            </Link>
          )}
        </div>
      ),
    },
  ];

  const coveredRegions = programOperations
    ? [...new Map(
        programOperations
          .filter((op) => op.scope?.region)
          .map((op) => [op.scope.region.id, op.scope.region.name]),
      ).values()]
    : [];
  const totalBeneficiaries = programOperations
    ? programOperations.reduce((sum, op) => sum + (op.assignedBeneficiariesCount || 0), 0)
    : null;

  return (
    <div>
      <PageHeader
        title="Programmes sociaux"
        subtitle="Référentiel des programmes de protection sociale nationale"
        actions={can('programs.create') ? (
          <Link to="/programmes/nouveau" className="btn btn-primary">
            <Plus size={16} /> Nouveau programme
          </Link>
        ) : null}
      />

      {(detailLoading || detail || detailError) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {detail?.code === DEMO_PROGRAM_CODE && (
                <Star size={16} color="var(--green-primary)" fill="var(--green-primary)" />
              )}
              {detail ? detail.name : 'Chargement...'}
            </h2>
            <button
              onClick={handleClose}
              className="btn btn-secondary btn-sm"
            >
              <X size={14} /> Fermer
            </button>
          </div>

          {detailLoading && <LoadingState message="Chargement du programme..." />}

          {detailError && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
              {detailError}
            </div>
          )}

          {detail && !detailLoading && (
            <>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14, marginBottom: 16 }}>
                <DetailField label="Code" value={detail.code} />
                <DetailField label="Statut" value={<StatusBadge status={mapStatus(detail.status)} />} />
                <DetailField label="Type" value={detail.type || '—'} />
                <DetailField label="Institution" value={detail.institution || '—'} />
                <DetailField label="Date de début" value={detail.startDate ? new Date(detail.startDate).toLocaleDateString('fr-FR') : '—'} />
                <DetailField label="Date de fin" value={detail.endDate ? new Date(detail.endDate).toLocaleDateString('fr-FR') : '—'} />
                <DetailField label="Budget prévu" value={detail.budgetAmount ? formatCurrency(Number(detail.budgetAmount)) : '—'} />
                <DetailField label="Opérations" value={detail.operationsCount ?? 0} />
                <DetailField
                  label="Régions couvertes"
                  value={coveredRegions.length > 0 ? coveredRegions.join(', ') : '—'}
                />
                <DetailField
                  label="Bénéficiaires inclus (toutes opérations)"
                  value={totalBeneficiaries !== null ? formatNumber(totalBeneficiaries) : '—'}
                />
                {detail.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <dt style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 2 }}>Description</dt>
                    <dd style={{ margin: 0, color: '#111827' }}>{detail.description}</dd>
                  </div>
                )}
              </dl>

              {programOperations && programOperations.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>
                    Opérations de paiement liées
                  </h3>
                  <table className="data-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Opération</th>
                        <th>Statut</th>
                        <th>Région</th>
                        <th>Bénéficiaires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programOperations.map((op) => (
                        <tr key={op.id}>
                          <td>
                            <Link to={`/operations/${op.id}`}>{op.name}</Link>
                          </td>
                          <td><StatusBadge status={mapStatus(op.status)} /></td>
                          <td>{op.scope?.region?.name || '—'}</td>
                          <td>{formatNumber(op.assignedBeneficiariesCount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Link to="/rapports" className="btn btn-primary btn-sm">
                <FileBarChart size={14} /> Ouvrir les rapports et exports
              </Link>
            </>
          )}
        </div>
      )}

      {programs.length === 0 ? (
        <EmptyState message="Aucun programme social enregistré." />
      ) : (
        <DataTable columns={columns} data={programs} />
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

export default Programs;
