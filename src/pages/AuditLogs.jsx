import { useState, useCallback } from 'react';
import { Eye, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { listAuditLogs, getAuditLog } from '../services/auditLogsService';
import { formatActionLabel, formatEntityType, formatSource } from '../utils/auditLabels';

const SENSITIVE_FIELDS = new Set([
  'nni', 'phone', 'phoneNumber', 'email', 'emailAddress',
  'password', 'passwordHash',
  'deviceSecret', 'deviceId', 'deviceUid', 'token', 'accessToken',
  'refreshToken', 'secret', 'pin', 'otp',
  'ipAddress', 'gpsLatitude', 'gpsLongitude',
  'latitude', 'longitude', 'coordinates',
  'metadata',
]);

const SAFE_FIELD_LABELS = {
  fullName: 'Nom complet',
  status: 'Statut',
  gender: 'Genre',
  amount: 'Montant',
  plannedAmount: 'Montant prévu',
  period: 'Période',
  name: 'Nom',
  code: 'Code',
  description: 'Description',
  severity: 'Sévérité',
  type: 'Type',
  reason: 'Motif',
  notes: 'Notes',
  resolution: 'Résolution',
  targetStatus: 'Statut cible',
  registryCode: 'Code registre',
};

function formatSafeValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}

function renderChanges(oldValues, newValues) {
  if (!oldValues && !newValues) return null;
  const old = (oldValues && typeof oldValues === 'object' && !Array.isArray(oldValues)) ? oldValues : {};
  const nw = (newValues && typeof newValues === 'object' && !Array.isArray(newValues)) ? newValues : {};
  const allKeys = [...new Set([...Object.keys(old), ...Object.keys(nw)])];
  const safeKeys = allKeys.filter((k) => SAFE_FIELD_LABELS[k] && !SENSITIVE_FIELDS.has(k));

  if (safeKeys.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun détail de modification affichable.</p>;
  }

  return (
    <table className="data-table" style={{ fontSize: 13 }}>
      <thead>
        <tr>
          <th>Champ</th>
          <th>Ancienne valeur</th>
          <th>Nouvelle valeur</th>
        </tr>
      </thead>
      <tbody>
        {safeKeys.map((key) => (
          <tr key={key}>
            <td style={{ fontWeight: 500 }}>{SAFE_FIELD_LABELS[key]}</td>
            <td>{formatSafeValue(old[key])}</td>
            <td>{formatSafeValue(nw[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetcher = useCallback(
    () => listAuditLogs({
      page,
      limit: 20,
      action: action || undefined,
      entityType: entityType || undefined,
    }),
    [page, action, entityType],
  );
  const { data, loading, error, reload } = useApi(fetcher, [page, action, entityType]);

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const d = await getAuditLog(id);
      setDetail(d);
    } catch (err) {
      setDetailError(err.message || 'Erreur lors du chargement du détail');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString('fr-FR'),
    },
    {
      key: 'actor',
      header: 'Utilisateur',
      render: (row) => row.actor?.fullName || 'Système',
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => formatActionLabel(row.action),
    },
    {
      key: 'entityType',
      header: 'Entité',
      render: (row) => formatEntityType(row.entityType),
    },
    { key: 'source', header: 'Source', render: (row) => formatSource(row.source) },
    {
      key: 'result',
      header: 'Résultat',
      render: () => <StatusBadge status="valide" label="Effectuée" />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetail(row.id)}>
          <Eye size={13} /> Détail
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit"
        subtitle="Traçabilité complète des actions sensibles."
      />

      <div className="card" style={{ marginBottom: 16, padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label htmlFor="audit-action-filter" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
            Action
            <input id="audit-action-filter" name="action" type="text" placeholder="ex: payment.validate" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }} />
          </label>
          <label htmlFor="audit-entity-type-filter" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
            Type d'entité
            <select id="audit-entity-type-filter" name="entityType" value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
              <option value="">Tous</option>
              <option value="Payment">Paiement</option>
              <option value="PaymentOperation">Opération de paiement</option>
              <option value="Beneficiary">Bénéficiaire</option>
              <option value="Agent">Agent</option>
              <option value="Device">Dispositif</option>
              <option value="SocialProgram">Programme social</option>
              <option value="Anomaly">Anomalie</option>
            </select>
          </label>
        </div>
      </div>

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
            <h2 className="card-title" style={{ margin: 0 }}>Détail de l'action</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setDetail(null)}>
              <X size={14} /> Fermer
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Action</span>
              <span style={{ fontSize: 14 }}>{formatActionLabel(detail.action)}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Date et heure</span>
              <span style={{ fontSize: 14 }}>{new Date(detail.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Utilisateur</span>
              <span style={{ fontSize: 14 }}>{detail.actor?.fullName || 'Système'}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Source</span>
              <span style={{ fontSize: 14 }}>{formatSource(detail.source)}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Type d'entité</span>
              <span style={{ fontSize: 14 }}>{formatEntityType(detail.entityType)}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Résultat</span>
              <StatusBadge status="valide" label="Effectuée" />
            </div>
            {detail.ipAddress && (
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Adresse IP</span>
                <span style={{ fontSize: 14 }}>{detail.ipAddress}</span>
              </div>
            )}
          </div>

          {(detail.oldValues || detail.newValues) && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Modifications</h3>
              {renderChanges(detail.oldValues, detail.newValues)}
            </>
          )}

          {!detail.oldValues && !detail.newValues && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucun détail de modification affichable.</p>
          )}
        </div>
      )}

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (data?.data?.length === 0 ? (
        <EmptyState message="Aucun enregistrement d'audit trouvé." />
      ) : (
        <>
          <DataTable columns={columns} data={data?.data || []} />
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: '#6B7280' }}>Page {data.page} / {data.totalPages} ({data.total} entrées)</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
            </div>
          )}
        </>
      ))}
    </div>
  );
}

export default AuditLogs;
