import { useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { getOperation, listAssignedBeneficiaries, assignBeneficiaries } from '../services/operationsService';
import { listBeneficiaries } from '../services/beneficiariesService';
import { mapStatus } from '../utils/statusMap';
import './PaymentOperationBeneficiaries.css';

function PaymentOperationBeneficiaries() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: operation, loading: opLoading, error: opError } = useApi(() => getOperation(id), [id]);

  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const fetcher = useCallback(
    () => listBeneficiaries({ page, limit: 20, search: searchTerm || undefined }),
    [page, searchTerm],
  );
  const { data: benData, loading: benLoading, error: benError, reload: benReload } = useApi(fetcher, [page, searchTerm]);

  const assignedFetcher = useCallback(
    () => listAssignedBeneficiaries(id, { page: 1, limit: 100 }),
    [id],
  );
  const { data: assignedData, reload: reloadAssigned } = useApi(assignedFetcher, [id]);

  const assignmentMap = useMemo(() => {
    if (!assignedData?.data) return new Map();
    const map = new Map();
    for (const a of assignedData.data) {
      map.set(a.beneficiaryId, a.inclusionStatus);
    }
    return map;
  }, [assignedData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1);
  };

  const toggleSelect = (beneficiaryId) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[beneficiaryId]) {
        delete next[beneficiaryId];
      } else {
        next[beneficiaryId] = true;
      }
      return next;
    });
  };

  const selectedIds = Object.keys(selected);
  const selectedCount = selectedIds.length;

  const handleAssign = async () => {
    if (selectedCount === 0) return;
    setSubmitting(true);
    setSubmitError('');
    setResult(null);
    try {
      const res = await assignBeneficiaries(
        id,
        selectedIds.map((bid) => ({ beneficiaryId: bid })),
      );
      setResult(res);
      setSelected({});
      reloadAssigned();
    } catch (err) {
      setSubmitError(err.message || 'Erreur lors de l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigate(`/operations/${id}`);
  };

  if (opLoading) return <LoadingState />;
  if (opError) return <ErrorState message={opError} />;
  if (!operation) return <ErrorState message="Opération introuvable" />;

  const canAssign = operation.status === 'DRAFT' || operation.status === 'VALIDATED';
  if (!canAssign) {
    return (
      <div>
        <PageHeader
          title="Affectation des bénéficiaires"
          actions={
            <Link to={`/operations/${id}`} className="btn btn-secondary">
              <ArrowLeft size={16} /> Retour à l'opération
            </Link>
          }
        />
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            L'affectation des bénéficiaires est disponible uniquement avant l'ouverture de l'opération.
          </p>
        </div>
      </div>
    );
  }

  const beneficiaries = benData?.data || [];

  return (
    <div>
      <PageHeader
        title="Affecter des bénéficiaires"
        subtitle={`${operation.name} — ${operation.code}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedCount > 0 && (
              <span className="assign-selection-count">
                <Users size={14} /> {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            )}
            <Link to={`/operations/${id}`} className="btn btn-secondary">
              <ArrowLeft size={16} /> Retour
            </Link>
          </div>
        }
      />

      <div className="assign-header-meta">
        <StatusBadge status={mapStatus(operation.status)} />
        <span className="assign-header-code">
          Bénéficiaires inclus : {operation.beneficiaryAssignmentSummary?.byStatus?.INCLUDED || 0}
        </span>
      </div>

      {result && (
        <div className="assign-result-banner assign-result-success">
          <CheckCircle size={16} />
          {result.assigned} bénéficiaire{result.assigned > 1 ? 's' : ''} affecté{result.assigned > 1 ? 's' : ''}
          {result.skippedDuplicates > 0 && `, ${result.skippedDuplicates} déjà affecté${result.skippedDuplicates > 1 ? 's' : ''}`}.
          <button className="btn btn-primary btn-sm" onClick={handleDone} style={{ marginLeft: 'auto' }}>
            Retour à l'opération
          </button>
        </div>
      )}

      {submitError && (
        <div className="assign-result-banner assign-result-error">
          <AlertTriangle size={16} />
          {submitError}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Recherche des bénéficiaires</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Nom, NNI ou code registre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '8px 10px',
              border: '1px solid var(--border-light)',
              borderRadius: 6,
              fontSize: 14,
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Rechercher
          </button>
        </form>

        {benLoading && <LoadingState message="Chargement des bénéficiaires..." />}
        {benError && <ErrorState message={benError} onRetry={benReload} />}

        {!benLoading && !benError && (
          <>
            <div className="assign-table-wrapper">
              <table className="assign-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Code registre</th>
                    <th>Nom complet</th>
                    <th>NNI</th>
                    <th>Localité</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficiaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Aucun bénéficiaire trouvé.
                      </td>
                    </tr>
                  ) : (
                    beneficiaries.map((ben) => {
                      const assignStatus = assignmentMap.get(ben.id);
                      const isIncluded = assignStatus === 'INCLUDED';
                      const isExcluded = assignStatus === 'EXCLUDED';
                      const isUnavailable = isIncluded || isExcluded;
                      return (
                        <tr key={ben.id} className={isUnavailable ? 'assign-row-assigned' : ''}>
                          <td>
                            {isUnavailable ? (
                              <input type="checkbox" checked={isIncluded} disabled />
                            ) : (
                              <input
                                type="checkbox"
                                checked={!!selected[ben.id]}
                                onChange={() => toggleSelect(ben.id)}
                              />
                            )}
                          </td>
                          <td>{ben.registryCode || '—'}</td>
                          <td>{ben.fullName}</td>
                          <td>{ben.nni || '—'}</td>
                          <td>{ben.locality?.name || '—'}</td>
                          <td>
                            <StatusBadge status={mapStatus(ben.status)} />
                            {isIncluded && <span className="assign-already-label"> Déjà affecté</span>}
                            {isExcluded && <span className="assign-excluded-label"> Exclu de l'opération</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {benData && benData.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
                <span style={{ lineHeight: '32px', fontSize: 13, color: '#6B7280' }}>
                  Page {benData.page} / {benData.totalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={page >= benData.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div className="assign-actions-bar">
          <button
            className="btn btn-primary"
            disabled={selectedCount === 0 || submitting}
            onClick={handleAssign}
          >
            {submitting
              ? 'Affectation en cours...'
              : `Affecter les bénéficiaires sélectionnés (${selectedCount})`}
          </button>
          <Link to={`/operations/${id}`} className="btn btn-secondary">
            Annuler
          </Link>
          {selectedCount > 0 && (
            <span className="assign-summary">
              {selectedCount} bénéficiaire{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentOperationBeneficiaries;
