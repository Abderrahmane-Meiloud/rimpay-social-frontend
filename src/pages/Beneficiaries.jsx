import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UploadCloud } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { listBeneficiaries } from '../services/beneficiariesService';
import { listRegions } from '../services/geographyService';
import { mapStatus } from '../utils/statusMap';
import { maskNni } from '../utils/mask';
import './Beneficiaries.css';

const columns = [
  { key: 'fullName', header: 'Nom complet' },
  { key: 'nni', header: 'NNI', render: (row) => maskNni(row.nni) },
  {
    key: 'phone',
    header: 'Téléphone',
    render: (row) => row.primaryContact?.phone || '—',
  },
  {
    key: 'locality',
    header: 'Localité',
    render: (row) => row.locality?.name || '—',
  },
  {
    key: 'status',
    header: 'Statut',
    render: (row) => <StatusBadge status={mapStatus(row.status)} />,
  },
  {
    key: 'region',
    header: 'Région',
    render: (row) => row.region?.name || '—',
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (row) => (
      <Link to={`/beneficiaires/${row.id}`} className="btn btn-secondary btn-sm">
        Voir
      </Link>
    ),
  },
];

function Beneficiaries() {
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [regionId, setRegionId] = useState('');

  const { data: regionsData } = useApi(() => listRegions(), []);
  const regions = regionsData || [];

  const fetcher = useCallback(
    () => listBeneficiaries({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      regionId: regionId || undefined,
    }),
    [page, search, status, regionId],
  );
  const { data, loading, error, reload } = useApi(fetcher, [page, search, status, regionId]);

  return (
    <div>
      <PageHeader
        title="Bénéficiaires"
        subtitle="Gestion et contrôle qualité des données du Registre Social"
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            {can('beneficiaries.import') && (
              <Link to="/beneficiaires/import" className="btn btn-secondary">
                <UploadCloud size={16} /> Importer
              </Link>
            )}
            {can('beneficiaries.create') && (
              <Link to="/beneficiaires/nouveau" className="btn btn-primary"><UserPlus size={16} /> Nouveau</Link>
            )}
          </div>
        )}
      />

      <div className="card filters-card">
        <div className="filters-grid">
          <label className="filter-field">
            Recherche
            <input
              type="text"
              placeholder="Nom, code registre ou NNI"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </label>
          <label className="filter-field">
            Région
            <select value={regionId} onChange={(e) => { setRegionId(e.target.value); setPage(1); }}>
              <option value="">Toutes</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Statut
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tous</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </label>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <DataTable columns={columns} data={data?.data || []} emptyMessage="Aucun bénéficiaire ne correspond à ces critères." />
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: '#6B7280' }}>Page {data.page} / {data.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Beneficiaries;
