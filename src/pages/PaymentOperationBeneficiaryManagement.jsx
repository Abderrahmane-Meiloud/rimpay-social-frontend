import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import {
  getOperation,
  listAssignedBeneficiaries,
  excludeOperationBeneficiary,
  reincludeOperationBeneficiary,
} from '../services/operationsService';
import { mapStatus } from '../utils/statusMap';
import './PaymentOperationBeneficiaryManagement.css';

const PAGE_LIMIT = 20;

function PaymentOperationBeneficiaryManagement() {
  const { id } = useParams();
  const { data: operation, loading: opLoading, error: opError, reload: reloadOp } = useApi(() => getOperation(id), [id]);

  const [includedPage, setIncludedPage] = useState(1);
  const [excludedPage, setExcludedPage] = useState(1);

  const includedFetcher = useCallback(
    () => listAssignedBeneficiaries(id, { page: includedPage, limit: PAGE_LIMIT, status: 'INCLUDED' }),
    [id, includedPage],
  );
  const excludedFetcher = useCallback(
    () => listAssignedBeneficiaries(id, { page: excludedPage, limit: PAGE_LIMIT, status: 'EXCLUDED' }),
    [id, excludedPage],
  );
  const { data: includedData, loading: incLoading, reload: reloadIncluded } = useApi(includedFetcher, [id, includedPage]);
  const { data: excludedData, loading: excLoading, reload: reloadExcluded } = useApi(excludedFetcher, [id, excludedPage]);

  useEffect(() => {
    const maxPage = includedData?.totalPages || 1;
    if (includedPage > maxPage) setIncludedPage(maxPage);
  }, [includedData?.totalPages, includedPage]);

  useEffect(() => {
    const maxPage = excludedData?.totalPages || 1;
    if (excludedPage > maxPage) setExcludedPage(maxPage);
  }, [excludedData?.totalPages, excludedPage]);

  const [confirmingExclude, setConfirmingExclude] = useState(null);
  const [confirmingReinclude, setConfirmingReinclude] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshAll = () => {
    reloadOp();
    reloadIncluded();
    reloadExcluded();
  };

  const handleExclude = async (beneficiaryId) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await excludeOperationBeneficiary(id, beneficiaryId);
      setSuccessMsg('Bénéficiaire exclu de l\'opération.');
      setConfirmingExclude(null);
      refreshAll();
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de l\'exclusion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinclude = async (beneficiaryId) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await reincludeOperationBeneficiary(id, beneficiaryId);
      setSuccessMsg('Bénéficiaire ré-inclus dans l\'opération.');
      setConfirmingReinclude(null);
      refreshAll();
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de la ré-inclusion');
    } finally {
      setActionLoading(false);
    }
  };

  if (opLoading) return <LoadingState />;
  if (opError) return <ErrorState message={opError} />;
  if (!operation) return <ErrorState message="Opération introuvable" />;

  const canManage = operation.status === 'DRAFT' || operation.status === 'VALIDATED';
  const included = includedData?.data || [];
  const excluded = excludedData?.data || [];
  const includedTotal = includedData?.total ?? 0;
  const excludedTotal = excludedData?.total ?? 0;
  const includedTotalPages = includedData?.totalPages ?? 1;
  const excludedTotalPages = excludedData?.totalPages ?? 1;

  return (
    <div>
      <PageHeader
        title="Gestion des bénéficiaires"
        subtitle={`${operation.name} — ${operation.code}`}
        actions={
          <Link to={`/operations/${id}`} className="btn btn-secondary">
            <ArrowLeft size={16} /> Retour à l'opération
          </Link>
        }
      />

      <div className="mgmt-header-meta">
        <StatusBadge status={mapStatus(operation.status)} />
      </div>

      {!canManage && (
        <div className="mgmt-readonly-note">
          La gestion des affectations est disponible uniquement avant l'ouverture de l'opération.
        </div>
      )}

      {successMsg && (
        <div className="mgmt-result-banner mgmt-result-success">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mgmt-result-banner mgmt-result-error">
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="mgmt-section-title">
          Bénéficiaires inclus ({includedTotal})
        </h2>

        {incLoading ? (
          <LoadingState message="Chargement..." />
        ) : (
          <>
            <div className="mgmt-table-wrapper">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th>Code registre</th>
                    <th>Nom complet</th>
                    <th>NNI</th>
                    <th>Localité</th>
                    <th>Paiement</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {included.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Aucun bénéficiaire inclus.
                      </td>
                    </tr>
                  ) : (
                    included.map((ben) => (
                      <BeneficiaryRow
                        key={ben.id}
                        ben={ben}
                        canManage={canManage}
                        actionType="exclude"
                        isConfirming={confirmingExclude === ben.beneficiaryId}
                        onStartConfirm={() => { setConfirmingExclude(ben.beneficiaryId); setConfirmingReinclude(null); setErrorMsg(''); }}
                        onCancel={() => setConfirmingExclude(null)}
                        onConfirm={() => handleExclude(ben.beneficiaryId)}
                        actionLoading={actionLoading}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {includedTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" disabled={includedPage <= 1} onClick={() => setIncludedPage(includedPage - 1)}>Précédent</button>
                <span style={{ lineHeight: '32px', fontSize: 13, color: '#6B7280' }}>
                  Page {includedPage} / {includedTotalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={includedPage >= includedTotalPages} onClick={() => setIncludedPage(includedPage + 1)}>Suivant</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="mgmt-section-title">
          Historique des exclusions ({excludedTotal})
        </h2>

        {excLoading ? (
          <LoadingState message="Chargement..." />
        ) : (
          <>
            <div className="mgmt-table-wrapper">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th>Code registre</th>
                    <th>Nom complet</th>
                    <th>NNI</th>
                    <th>Localité</th>
                    <th>Paiement</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {excluded.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                        Aucune exclusion historique.
                      </td>
                    </tr>
                  ) : (
                    excluded.map((ben) => (
                      <BeneficiaryRow
                        key={ben.id}
                        ben={ben}
                        canManage={canManage}
                        actionType="reinclude"
                        isConfirming={confirmingReinclude === ben.beneficiaryId}
                        onStartConfirm={() => { setConfirmingReinclude(ben.beneficiaryId); setConfirmingExclude(null); setErrorMsg(''); }}
                        onCancel={() => setConfirmingReinclude(null)}
                        onConfirm={() => handleReinclude(ben.beneficiaryId)}
                        actionLoading={actionLoading}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {excludedTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm" disabled={excludedPage <= 1} onClick={() => setExcludedPage(excludedPage - 1)}>Précédent</button>
                <span style={{ lineHeight: '32px', fontSize: 13, color: '#6B7280' }}>
                  Page {excludedPage} / {excludedTotalPages}
                </span>
                <button className="btn btn-secondary btn-sm" disabled={excludedPage >= excludedTotalPages} onClick={() => setExcludedPage(excludedPage + 1)}>Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BeneficiaryRow({ ben, canManage, actionType, isConfirming, onStartConfirm, onCancel, onConfirm, actionLoading }) {
  const isExcludeBlocked = actionType === 'exclude' && !ben.exclusionAllowed;

  return (
    <>
      <tr>
        <td>{ben.registryCode || '—'}</td>
        <td>{ben.fullName}</td>
        <td>{ben.nni || '—'}</td>
        <td>{ben.locality || '—'}</td>
        <td>
          {ben.paymentExists ? (
            <StatusBadge status={mapStatus(ben.paymentStatus)} />
          ) : (
            <span className="mgmt-payment-badge mgmt-payment-none">Aucun</span>
          )}
        </td>
        {canManage && (
          <td>
            {actionType === 'exclude' && (
              isExcludeBlocked ? (
                <span className="mgmt-block-reason">
                  Exclusion impossible — {ben.exclusionBlockReason}
                </span>
              ) : (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onStartConfirm}
                  disabled={actionLoading}
                  style={{ color: '#991b1b' }}
                >
                  Exclure
                </button>
              )
            )}
            {actionType === 'reinclude' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onStartConfirm}
                disabled={actionLoading}
              >
                Ré-inclure
              </button>
            )}
          </td>
        )}
      </tr>
      {isConfirming && (
        <tr>
          <td colSpan={canManage ? 6 : 5} style={{ padding: 0 }}>
            <div className={`mgmt-confirm-panel ${actionType === 'exclude' ? 'mgmt-confirm-exclude' : 'mgmt-confirm-reinclude'}`}>
              {actionType === 'exclude' ? (
                <span>Confirmer l'exclusion de <strong>{ben.fullName}</strong> de cette opération ?</span>
              ) : (
                <span>Confirmer la ré-inclusion de <strong>{ben.fullName}</strong> dans cette opération ?</span>
              )}
              <div className="mgmt-confirm-actions">
                <button
                  className={`btn btn-sm ${actionType === 'exclude' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={onConfirm}
                  disabled={actionLoading}
                  style={actionType === 'exclude' ? { color: '#991b1b', borderColor: '#991b1b' } : {}}
                >
                  {actionLoading
                    ? 'En cours...'
                    : actionType === 'exclude'
                      ? "Confirmer l'exclusion"
                      : 'Confirmer la ré-inclusion'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onCancel}
                  disabled={actionLoading}
                >
                  Annuler
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default PaymentOperationBeneficiaryManagement;
