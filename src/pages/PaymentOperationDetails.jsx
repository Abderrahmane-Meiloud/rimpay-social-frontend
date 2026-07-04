import React, { useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Edit, Users, Settings, CreditCard, CheckCircle, AlertTriangle, Eye, FileDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { getOperation, getOperationPayments, transitionOperationStatus, listAssignedBeneficiaries, generateOperationPayments } from '../services/operationsService';
import { cancelPayment, getPayment } from '../services/paymentsService';
import { formatCurrency, formatNumber } from '../utils/format';
import { mapStatus } from '../utils/statusMap';
import './PaymentOperationDetails.css';

const TRANSITION_MAP = {
  DRAFT: [
    { target: 'VALIDATED', label: 'Valider', variant: 'primary' },
    { target: 'ARCHIVED', label: 'Archiver', variant: 'secondary' },
  ],
  VALIDATED: [
    { target: 'OPEN', label: 'Ouvrir', variant: 'primary' },
    { target: 'ARCHIVED', label: 'Archiver', variant: 'secondary' },
  ],
  OPEN: [
    { target: 'IN_PROGRESS', label: 'Démarrer', variant: 'primary' },
    { target: 'SUSPENDED', label: 'Suspendre', variant: 'secondary' },
  ],
  IN_PROGRESS: [
    { target: 'SUSPENDED', label: 'Suspendre', variant: 'secondary' },
    { target: 'CLOSED', label: 'Clôturer', variant: 'primary' },
  ],
  SUSPENDED: [
    { target: 'OPEN', label: 'Reprendre', variant: 'primary' },
    { target: 'IN_PROGRESS', label: 'Reprendre en cours', variant: 'primary' },
  ],
  CLOSED: [
    { target: 'ARCHIVED', label: 'Archiver', variant: 'secondary' },
  ],
  ARCHIVED: [],
};

const PAYMENT_STATUS_FILTERS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PAID', label: 'Payé' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CANCELLED', label: 'Annulé' },
];

function PaymentOperationDetails() {
  const { id } = useParams();
  const { can } = usePermissions();
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const { data: operation, loading, error, reload } = useApi(() => getOperation(id), [id]);
  const {
    data: paymentsData,
    loading: pLoading,
    reload: reloadPayments,
  } = useApi(
    () => getOperationPayments(id, { limit: 50, status: paymentStatusFilter || undefined }),
    [id, paymentStatusFilter],
  );
  const { data: assignedBenData, loading: abLoading } = useApi(() => listAssignedBeneficiaries(id, { page: 1, limit: 5, status: 'INCLUDED' }), [id]);

  const [transitioning, setTransitioning] = useState(null);
  const [transitionError, setTransitionError] = useState('');
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [paymentDetailLoading, setPaymentDetailLoading] = useState(false);
  const [paymentDetailError, setPaymentDetailError] = useState('');

  const handleTransition = useCallback(async (targetStatus) => {
    setTransitioning(targetStatus);
    setTransitionError('');
    try {
      await transitionOperationStatus(id, targetStatus);
      reload();
    } catch (err) {
      setTransitionError(err.message || 'Erreur lors de la transition');
    } finally {
      setTransitioning(null);
    }
  }, [id, reload]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    setGenResult(null);
    try {
      const result = await generateOperationPayments(id);
      setGenResult(result);
      setShowGenConfirm(false);
      reload();
      reloadPayments();
    } catch (err) {
      setGenError(err.message || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  }, [id, reload, reloadPayments]);

  const handleCancel = useCallback(async (paymentId) => {
    setCancelling(true);
    setCancelSuccess('');
    setCancelError('');
    try {
      await cancelPayment(paymentId, cancelReason || undefined);
      setCancelSuccess('Paiement annulé avec succès.');
      setCancelConfirm(null);
      setCancelReason('');
      reload();
      reloadPayments();
    } catch (err) {
      setCancelError(err.message || "Erreur lors de l'annulation");
      reloadPayments();
    } finally {
      setCancelling(false);
    }
  }, [cancelReason, reload, reloadPayments]);

  const handleViewPayment = useCallback(async (paymentId) => {
    setPaymentDetailLoading(true);
    setPaymentDetailError('');
    try {
      const detail = await getPayment(paymentId);
      setPaymentDetail(detail);
    } catch (err) {
      setPaymentDetailError(err.message || 'Erreur lors du chargement du détail');
    } finally {
      setPaymentDetailLoading(false);
    }
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!operation) return <Navigate to="/operations" replace />;

  const rate = Number(operation.executionRate || 0);
  const includedCount = operation.beneficiaryAssignmentSummary?.byStatus?.INCLUDED || 0;
  const excludedCount = operation.beneficiaryAssignmentSummary?.byStatus?.EXCLUDED || 0;
  const needsBeneficiaries = (operation.status === 'VALIDATED' || operation.status === 'SUSPENDED') && includedCount === 0;
  const allTransitions = TRANSITION_MAP[operation.status] || [];
  const transitions = needsBeneficiaries
    ? allTransitions.filter((t) => t.target !== 'OPEN')
    : allTransitions;
  const canEditOp = (operation.status === 'DRAFT' || operation.status === 'SUSPENDED') && can('operations.update');
  const canAssign = (operation.status === 'DRAFT' || operation.status === 'VALIDATED') && can('operations.update');
  const canGenerate = ['DRAFT', 'VALIDATED', 'OPEN'].includes(operation.status) && can('operations.update');
  const canCancelPayment = can('payments.cancel');

  const TRANSITION_PERMISSIONS = {
    OPEN: 'operations.open',
    CLOSED: 'operations.close',
  };
  const canDoTransition = (target) => can(TRANSITION_PERMISSIONS[target] || 'operations.update');
  const paymentTotal = operation.paymentSummary?.total || 0;

  return (
    <div>
      <PageHeader
        title={operation.name}
        subtitle={`${operation.socialProgram?.name || ''} — ${operation.code}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {canEditOp && (
              <Link to={`/operations/${id}/modifier`} className="btn btn-primary">
                <Edit size={16} /> Modifier
              </Link>
            )}
            <Link to="/operations" className="btn btn-secondary">
              <ArrowLeft size={16} /> Retour
            </Link>
          </div>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Résumé de l'opération</h2>
        <div className="op-summary-grid">
          <div className="op-summary-item">
            <span className="op-summary-label">Statut</span>
            <StatusBadge status={mapStatus(operation.status)} />
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Bénéficiaires inclus</span>
            <span className="op-summary-value">{formatNumber(includedCount)}</span>
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Montant prévu</span>
            <span className="op-summary-value">{operation.plannedAmount ? formatCurrency(Number(operation.plannedAmount)) : '—'}</span>
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Montant payé</span>
            <span className="op-summary-value">{formatCurrency(Number(operation.paidAmount || 0))}</span>
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Taux d'exécution</span>
            <span className="op-summary-value">{rate.toFixed(0)}%</span>
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${rate}%` }} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Bénéficiaires affectés</h2>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-primary)' }}>
            {formatNumber(includedCount)} inclus
          </span>
        </div>

        {!abLoading && assignedBenData?.data?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Code registre</th>
                  <th>Nom complet</th>
                  <th>NNI</th>
                  <th>Localité</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {assignedBenData.data.map((ab) => (
                  <tr key={ab.id}>
                    <td>{ab.registryCode || '—'}</td>
                    <td>{ab.fullName}</td>
                    <td>{ab.nni || '—'}</td>
                    <td>{ab.locality || '—'}</td>
                    <td><StatusBadge status={mapStatus(ab.inclusionStatus)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {assignedBenData.total > 5 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Affichage de 5 sur {assignedBenData.total} bénéficiaires inclus.
              </p>
            )}
          </div>
        )}

        {!abLoading && (!assignedBenData?.data || assignedBenData.data.length === 0) && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Aucun bénéficiaire inclus dans cette opération.
          </p>
        )}

        {excludedCount > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Exclusions historiques : {excludedCount}
          </p>
        )}

        {canAssign ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to={`/operations/${id}/beneficiaires`} className="btn btn-primary btn-sm">
              <Users size={14} /> Affecter des bénéficiaires
            </Link>
            <Link to={`/operations/${id}/beneficiaires/gestion`} className="btn btn-secondary btn-sm">
              <Settings size={14} /> Gérer les affectations
            </Link>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            L'affectation des bénéficiaires est disponible uniquement avant l'ouverture de l'opération.
          </p>
        )}
      </div>

      {(() => {
        const permittedTransitions = transitions.filter((t) => canDoTransition(t.target));
        return (permittedTransitions.length > 0 || needsBeneficiaries) ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Cycle de vie</h2>
            <p className="op-lifecycle-hint">Les transitions sont contrôlées par les règles métier.</p>
            {needsBeneficiaries && (
              <div className="op-lifecycle-prereq">
                Au moins un bénéficiaire doit être affecté avant l'ouverture de cette opération.
              </div>
            )}
            {transitionError && (
              <div className="form-error-banner" style={{ marginBottom: 12 }}>
                {transitionError}
              </div>
            )}
            {permittedTransitions.length > 0 && (
              <div className="op-lifecycle-actions">
                {permittedTransitions.map((t) => (
                  <button
                    key={t.target}
                    className={`btn ${t.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={transitioning !== null}
                    onClick={() => handleTransition(t.target)}
                  >
                    {transitioning === t.target ? 'En cours...' : t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null;
      })()}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="card-title">Génération des paiements</h2>

        <div className="op-summary-grid" style={{ marginBottom: 12 }}>
          <div className="op-summary-item">
            <span className="op-summary-label">Bénéficiaires inclus</span>
            <span className="op-summary-value">{formatNumber(includedCount)}</span>
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Paiements existants</span>
            <span className="op-summary-value">{formatNumber(paymentTotal)}</span>
          </div>
          <div className="op-summary-item">
            <span className="op-summary-label">Montant prévu</span>
            <span className="op-summary-value">{operation.plannedAmount ? formatCurrency(Number(operation.plannedAmount)) : '—'}</span>
          </div>
        </div>

        {genResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 12, backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', fontSize: 13.5, fontWeight: 500 }}>
            <CheckCircle size={16} />
            <span>
              {genResult.created} paiement{genResult.created > 1 ? 's' : ''} créé{genResult.created > 1 ? 's' : ''}
              {genResult.skippedExisting > 0 && `, ${genResult.skippedExisting} déjà existant${genResult.skippedExisting > 1 ? 's' : ''}`}
              {genResult.skippedMissingAmount > 0 && `, ${genResult.skippedMissingAmount} sans montant`}
            </span>
          </div>
        )}

        {genError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 12, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: 13.5, fontWeight: 500 }}>
            <AlertTriangle size={16} /> {genError}
          </div>
        )}

        {canGenerate ? (
          <>
            {!showGenConfirm ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { setShowGenConfirm(true); setGenResult(null); setGenError(''); }}
                disabled={includedCount === 0}
              >
                <CreditCard size={14} /> Générer les paiements
              </button>
            ) : (
              <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef3e2', border: '1px solid #fcd34d', color: '#92400e', fontSize: 13, marginBottom: 8 }}>
                <p style={{ marginBottom: 8 }}>
                  Cette action créera des paiements PENDING pour les bénéficiaires inclus qui n'ont pas encore de paiement. Les paiements existants ne seront pas dupliqués.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Bénéficiaires inclus : <strong>{includedCount}</strong>
                </p>
                {!operation.plannedAmount && (
                  <p style={{ marginBottom: 8, fontWeight: 600 }}>
                    ⚠ Aucun montant prévu au niveau de l'opération — les bénéficiaires sans montant individuel seront ignorés.
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
                    {generating ? 'Génération en cours...' : 'Confirmer la génération'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowGenConfirm(false)} disabled={generating}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {includedCount === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                Aucun bénéficiaire inclus — la génération n'est pas possible.
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            La génération des paiements est disponible uniquement pour les opérations en préparation (Brouillon, Validée) ou ouvertes.
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Paiements de l'opération</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="filter-field" style={{ margin: 0 }}>
              Statut
              <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                {PAYMENT_STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-disabled btn-sm"
              disabled
              title="Export indisponible pour cette vue : seul le rapport global de synthèse des paiements (page Rapports) est disponible."
            >
              <FileDown size={14} /> Export indisponible pour cette vue
            </button>
          </div>
        </div>

        {cancelSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 12, backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', fontSize: 13.5, fontWeight: 500 }}>
            <CheckCircle size={16} /> {cancelSuccess}
          </div>
        )}
        {cancelError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 12, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: 13.5, fontWeight: 500 }}>
            <AlertTriangle size={16} /> {cancelError}
          </div>
        )}

        {pLoading ? (
          <LoadingState message="Chargement des paiements..." />
        ) : (
          <PaymentsTable
            payments={paymentsData?.data || []}
            cancelConfirm={cancelConfirm}
            cancelReason={cancelReason}
            cancelling={cancelling}
            canCancelPayment={canCancelPayment}
            onStartCancel={(pid) => { setCancelConfirm(pid); setCancelReason(''); setCancelSuccess(''); setCancelError(''); }}
            onCancelConfirm={handleCancel}
            onCancelAbort={() => setCancelConfirm(null)}
            onReasonChange={setCancelReason}
            onViewDetail={handleViewPayment}
          />
        )}
      </div>
      {paymentDetailLoading && <LoadingState message="Chargement du détail de paiement..." />}
      {paymentDetailError && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', color: '#991b1b', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13 }}>
            {paymentDetailError}
          </div>
        </div>
      )}
      {paymentDetail && !paymentDetailLoading && (
        <PaymentDetailPanel detail={paymentDetail} onClose={() => setPaymentDetail(null)} />
      )}
    </div>
  );
}

function PaymentDetailPanel({ detail, onClose }) {
  const history = detail.recentStatusHistory || [];
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="card-title" style={{ margin: 0 }}>Détail du paiement</h2>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
      </div>
      <div className="op-summary-grid" style={{ marginBottom: 16 }}>
        <div className="op-summary-item">
          <span className="op-summary-label">Bénéficiaire</span>
          <span className="op-summary-value">{detail.beneficiary?.fullName || '—'}</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Opération</span>
          <span className="op-summary-value">{detail.operation?.name || '—'} ({detail.operation?.code || '—'})</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Montant</span>
          <span className="op-summary-value">{formatCurrency(Number(detail.amount || 0))}</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Statut</span>
          <StatusBadge status={mapStatus(detail.status)} />
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Programme</span>
          <span className="op-summary-value">{detail.socialProgram?.name || '—'}</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Localité</span>
          <span className="op-summary-value">{detail.geography?.locality?.name || '—'}</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Région</span>
          <span className="op-summary-value">{detail.geography?.region?.name || '—'}</span>
        </div>
        <div className="op-summary-item">
          <span className="op-summary-label">Date de création</span>
          <span className="op-summary-value">{new Date(detail.createdAt).toLocaleString('fr-FR')}</span>
        </div>
        {detail.paidAt && (
          <div className="op-summary-item">
            <span className="op-summary-label">Date de paiement</span>
            <span className="op-summary-value">{new Date(detail.paidAt).toLocaleString('fr-FR')}</span>
          </div>
        )}
        {detail.cancelledAt && (
          <div className="op-summary-item">
            <span className="op-summary-label">Date d'annulation</span>
            <span className="op-summary-value">{new Date(detail.cancelledAt).toLocaleString('fr-FR')}</span>
          </div>
        )}
      </div>

      {history.length > 0 && (
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
              {history.map((h) => (
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

      {detail.validationSummary && (detail.validationSummary.total > 0) && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Résumé de validation</h3>
          <div className="op-summary-grid">
            <div className="op-summary-item">
              <span className="op-summary-label">Total tentatives</span>
              <span className="op-summary-value">{detail.validationSummary.attempted}</span>
            </div>
            <div className="op-summary-item">
              <span className="op-summary-label">Acceptées</span>
              <span className="op-summary-value">{detail.validationSummary.accepted}</span>
            </div>
            <div className="op-summary-item">
              <span className="op-summary-label">Rejetées</span>
              <span className="op-summary-value">{detail.validationSummary.rejected}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CANCELLABLE = ['PENDING', 'VALIDATED', 'REJECTED', 'CONFLICT'];

function PaymentsTable({ payments, cancelConfirm, cancelReason, cancelling, canCancelPayment, onStartCancel, onCancelConfirm, onCancelAbort, onReasonChange, onViewDetail }) {
  if (payments.length === 0) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Aucun paiement.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Bénéficiaire</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Sync</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const isCancellable = CANCELLABLE.includes(p.status);
            const isConfirming = cancelConfirm === p.id;
            return (
              <React.Fragment key={p.id}>
                <tr>
                  <td>{p.beneficiary?.fullName || '—'}</td>
                  <td>{formatCurrency(Number(p.amount || 0))}</td>
                  <td><StatusBadge status={mapStatus(p.status)} /></td>
                  <td><StatusBadge status={mapStatus(p.syncStatus)} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => onViewDetail(p.id)}>
                        <Eye size={13} /> Voir
                      </button>
                      {isCancellable && canCancelPayment ? (
                        <button className="btn btn-secondary btn-sm" style={{ color: '#991b1b' }} onClick={() => onStartCancel(p.id)} disabled={cancelling}>
                          Annuler
                        </button>
                      ) : p.status === 'PAID' ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Effectué</span>
                      ) : p.status === 'CANCELLED' ? (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Annulé</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
                {isConfirming && (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div style={{ padding: '12px 16px', margin: '4px 0 8px', borderRadius: 8, backgroundColor: '#fef3e2', border: '1px solid #fcd34d', color: '#92400e', fontSize: 13 }}>
                        <p style={{ marginBottom: 8 }}>
                          Cette action annule définitivement ce paiement. Un paiement annulé ne peut pas être régénéré automatiquement.
                        </p>
                        <label style={{ display: 'block', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Motif d'annulation (facultatif)</span>
                          <input type="text" value={cancelReason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Ex: Bénéficiaire décédé" style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', border: '1px solid #fcd34d', borderRadius: 6, fontSize: 13 }} />
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-sm" style={{ color: '#991b1b', borderColor: '#991b1b' }} onClick={() => onCancelConfirm(p.id)} disabled={cancelling}>
                            {cancelling ? 'Annulation...' : "Confirmer l'annulation"}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={onCancelAbort} disabled={cancelling}>Retour</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentOperationDetails;
