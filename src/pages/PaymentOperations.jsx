import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { listOperations } from '../services/operationsService';
import { formatCurrency, formatNumber } from '../utils/format';
import { mapStatus } from '../utils/statusMap';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'VALIDATED', label: 'Validée' },
  { value: 'OPEN', label: 'Ouverte' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'SUSPENDED', label: 'Suspendue' },
  { value: 'CLOSED', label: 'Clôturée' },
  { value: 'ARCHIVED', label: 'Archivée' },
];

const columns = [
  { key: 'name', header: 'Opération', wrap: true },
  {
    key: 'program',
    header: 'Programme',
    render: (row) => row.socialProgram?.name || '—',
  },
  {
    key: 'region',
    header: 'Région',
    render: (row) => row.scope?.region?.name || '—',
  },
  { key: 'period', header: 'Période', render: (row) => row.period || '—' },
  {
    key: 'beneficiariesCount',
    header: 'Bénéficiaires inclus',
    render: (row) => formatNumber(row.assignedBeneficiariesCount || 0),
  },
  {
    key: 'amountPlanned',
    header: 'Montant prévu',
    render: (row) => row.plannedAmount ? formatCurrency(Number(row.plannedAmount)) : '—',
  },
  {
    key: 'amountPaid',
    header: 'Montant payé',
    render: (row) => formatCurrency(Number(row.paidAmount || 0)),
  },
  {
    key: 'executionRate',
    header: "Taux d'exécution",
    render: (row) => `${Number(row.executionRate || 0).toFixed(0)}%`,
  },
  {
    key: 'status',
    header: 'Statut',
    render: (row) => <StatusBadge status={mapStatus(row.status)} />,
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (row) => (
      <Link to={`/operations/${row.id}`} className="btn btn-secondary btn-sm">
        Voir
      </Link>
    ),
  },
];

function PaymentOperations() {
  const { can } = usePermissions();
  const [status, setStatus] = useState('');

  const fetcher = useCallback(
    () => listOperations({ limit: 50, status: status || undefined }),
    [status],
  );
  const { data, loading, error, reload } = useApi(fetcher, [status]);

  return (
    <div>
      <PageHeader
        title="Opérations de paiement"
        subtitle="Planification, suivi et exécution des opérations de paiement social"
        actions={can('operations.create') ? (
          <Link to="/operations/nouvelle" className="btn btn-primary">
            <PlusCircle size={16} /> Nouvelle opération
          </Link>
        ) : null}
      />

      <div className="card filters-card" style={{ marginBottom: 16 }}>
        <label className="filter-field" style={{ maxWidth: 260 }}>
          Statut
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <DataTable columns={columns} data={data?.data || []} emptyMessage="Aucune opération ne correspond à ce filtre." />
      )}
    </div>
  );
}

export default PaymentOperations;
