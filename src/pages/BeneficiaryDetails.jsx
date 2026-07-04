import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { getBeneficiary } from '../services/beneficiariesService';
import { mapStatus } from '../utils/statusMap';
import { maskNni } from '../utils/mask';
import './BeneficiaryDetails.css';

function BeneficiaryDetails() {
  const { id } = useParams();
  const { can } = usePermissions();
  const { data: beneficiary, loading, error } = useApi(() => getBeneficiary(id), [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!beneficiary) return <Navigate to="/beneficiaires" replace />;

  return (
    <div>
      <PageHeader
        title={beneficiary.fullName}
        subtitle={`Dossier bénéficiaire — ${beneficiary.registryCode}`}
        actions={
          <>
            {can('beneficiaries.update') && (
              <Link to={`/beneficiaires/${id}/modifier`} className="btn btn-primary">
                <Pencil size={16} /> Modifier
              </Link>
            )}
            <Link to="/beneficiaires" className="btn btn-secondary">
              <ArrowLeft size={16} /> Retour à la liste
            </Link>
          </>
        }
      />

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 className="card-title">Identité</h2>
          <dl className="detail-list">
            <div><dt>Nom complet</dt><dd>{beneficiary.fullName}</dd></div>
            <div><dt>Code registre</dt><dd>{beneficiary.registryCode}</dd></div>
            <div><dt>NNI</dt><dd>{maskNni(beneficiary.nni)}</dd></div>
            <div>
              <dt>Téléphone</dt>
              <dd>{beneficiary.primaryContact?.phone || '—'}</dd>
            </div>
            <div><dt>Genre</dt><dd>{beneficiary.gender === 'F' ? 'Féminin' : beneficiary.gender === 'M' ? 'Masculin' : '—'}</dd></div>
            <div>
              <dt>Statut</dt>
              <dd><StatusBadge status={mapStatus(beneficiary.status)} /></dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="card-title">Localisation</h2>
          <dl className="detail-list">
            <div><dt>Région</dt><dd>{beneficiary.region?.name || '—'}</dd></div>
            <div><dt>Moughataa</dt><dd>{beneficiary.moughataa?.name || '—'}</dd></div>
            <div><dt>Commune</dt><dd>{beneficiary.commune?.name || '—'}</dd></div>
            <div><dt>Localité</dt><dd>{beneficiary.locality?.name || '—'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="grid grid-2">
        {beneficiary.paymentSummary && (
          <div className="card">
            <h2 className="card-title">Derniers paiements</h2>
            <dl className="detail-list">
              <div><dt>Paiements enregistrés</dt><dd>{beneficiary.paymentSummary.total}</dd></div>
              <div><dt>Paiements effectués</dt><dd>{beneficiary.paymentSummary.paid}</dd></div>
              <div><dt>Paiements en attente</dt><dd>{beneficiary.paymentSummary.pending}</dd></div>
              <div>
                <dt>Dernier paiement effectué</dt>
                <dd>
                  {beneficiary.paymentSummary.lastPaidAt
                    ? new Date(beneficiary.paymentSummary.lastPaidAt).toLocaleDateString('fr-FR')
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {beneficiary.anomaliesSummary && (
          <div className="card">
            <h2 className="card-title">Anomalies</h2>
            <dl className="detail-list">
              <div><dt>Anomalies ouvertes</dt><dd>{beneficiary.anomaliesSummary.open}</dd></div>
              <div><dt>Anomalies au total</dt><dd>{beneficiary.anomaliesSummary.total}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

export default BeneficiaryDetails;
