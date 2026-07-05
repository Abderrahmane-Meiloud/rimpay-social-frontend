import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Wallet, AlertTriangle, Gauge, UserCog, Clock, BookOpen, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { getDashboardSummary } from '../services/dashboardService';
import { listAnomalies } from '../services/anomaliesService';
import { listAuditLogs } from '../services/auditLogsService';
import { listSyncBatches } from '../services/syncService';
import { formatCurrency, formatNumber } from '../utils/format';
import { mapStatus, mapAnomalyType } from '../utils/statusMap';
import { formatActionLabel } from '../utils/auditLabels';
import './Dashboard.css';

const PERIOD_OPTIONS = [
  { value: 'LAST_3_MONTHS', label: '3 derniers mois' },
  { value: 'LAST_6_MONTHS', label: '6 derniers mois' },
  { value: 'LAST_12_MONTHS', label: '12 derniers mois' },
  { value: 'CURRENT_YEAR', label: 'Année en cours' },
];

const FRENCH_MONTHS = {
  '01': 'Janv.', '02': 'Févr.', '03': 'Mars', '04': 'Avr.',
  '05': 'Mai', '06': 'Juin', '07': 'Juil.', '08': 'Août',
  '09': 'Sept.', '10': 'Oct.', '11': 'Nov.', '12': 'Déc.',
};

function formatMonthLabel(yyyymm) {
  if (!yyyymm || yyyymm.length < 7) return yyyymm || '';
  const [y, m] = yyyymm.split('-');
  return `${FRENCH_MONTHS[m] || m} ${y}`;
}

function formatAmountString(amountStr) {
  if (!amountStr || amountStr === '0') return '0 MRU';
  const num = Number(amountStr);
  if (!Number.isFinite(num)) return `${amountStr} MRU`;
  return formatCurrency(num);
}

function safeChartNumber(amountStr) {
  if (!amountStr) return null;
  const num = Number(amountStr);
  return Number.isFinite(num) ? num : null;
}

function formatTooltipMRU(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
  return formatCurrency(value);
}

const operationColumns = [
  {
    key: 'name',
    header: 'Opération',
    wrap: true,
    render: (row) => (
      <Link to={`/operations/${row.id}`} className="dashboard-operation-link">
        {row.name}
      </Link>
    ),
  },
  {
    key: 'region',
    header: 'Région',
    render: (row) => row.regionName || '—',
  },
  {
    key: 'program',
    header: 'Programme',
    wrap: true,
    render: (row) => row.programName || '—',
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
];

function Dashboard() {
  const { can } = usePermissions();
  const [period, setPeriod] = useState('LAST_12_MONTHS');
  // Real production data by default. The ministerial demo scenario is an
  // opt-in view, never the default — it must never be presented as normal
  // production data.
  const [demoOnly, setDemoOnly] = useState(false);

  const fetcher = useCallback(
    () => getDashboardSummary(period, demoOnly ? 'MINISTERIAL_DEMO' : undefined),
    [period, demoOnly],
  );
  const { data, loading, error, reload } = useApi(fetcher, [period, demoOnly]);

  const { data: recentAnomaliesData } = useApi(() => listAnomalies({ limit: 5 }), []);
  const { data: recentAuditData } = useApi(() => listAuditLogs({ limit: 5 }), []);
  const canReadSync = can('sync.read');
  const { data: lastSyncData } = useApi(
    () => (canReadSync ? listSyncBatches({ limit: 1 }) : Promise.resolve(null)),
    [canReadSync],
  );

  if (loading) return <LoadingState message="Chargement du tableau de bord..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const analytics = data.analytics;
  const recentAnomalies = recentAnomaliesData?.data || [];
  const recentAuditActions = recentAuditData?.data || [];
  const lastSyncBatch = lastSyncData?.data?.[0] || null;
  const lastSyncAt = lastSyncBatch?.completedAt || lastSyncBatch?.createdAt || null;

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble des opérations de paiement social"
      />

      {demoOnly && (
        <div className="dashboard-demo-banner">
          <ShieldAlert size={16} />
          <span>Données fictives — Démonstration institutionnelle</span>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setDemoOnly(false)}
          >
            Revenir aux données réelles
          </button>
        </div>
      )}

      {!demoOnly && (
        <div className="dashboard-demo-toggle">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setDemoOnly(true)}
          >
            <ShieldAlert size={14} /> Voir la démonstration ministérielle
          </button>
        </div>
      )}

      <div className="grid dashboard-stats-grid" style={{ marginBottom: 16 }}>
        <StatCard icon={Users} label="Bénéficiaires actifs" value={formatNumber(data.activeBeneficiaries)} accent="green" />
        <StatCard
          icon={Wallet}
          label="Montant total prévu"
          value={formatAmountString(data.totalAmountPlanned)}
          accent="gray"
        />
        <StatCard icon={CheckCircle2} label="Montant distribué" value={formatAmountString(data.totalAmountPaid)} accent="green" />
        <StatCard icon={Gauge} label="Taux d'exécution" value={`${Math.round(Number(data.executionRate || 0))}%`} accent="warning" />
        <StatCard icon={Clock} label="Paiements en attente" value={formatNumber(data.pendingPayments)} accent="warning" />
        <StatCard icon={AlertTriangle} label="Anomalies ouvertes" value={data.openAnomalies} accent="danger" />
        <StatCard icon={Gauge} label="Opérations ouvertes" value={data.openOperations} accent="warning" />
        <StatCard icon={UserCog} label="Agents actifs" value={data.activeAgents} accent="gray" />
        <StatCard icon={BookOpen} label="Programmes sociaux" value={data.programsTotal} accent="gray" />
        <StatCard
          icon={RefreshCw}
          label="Dernière synchronisation"
          value={canReadSync ? (lastSyncAt ? new Date(lastSyncAt).toLocaleString('fr-FR') : 'Aucune') : 'Non disponible'}
          accent="gray"
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 className="card-title">Paiements par statut</h2>
          <table className="dashboard-mini-table">
            <thead>
              <tr><th>Statut</th><th>Nombre</th></tr>
            </thead>
            <tbody>
              {(data.paymentsByStatus || []).map((row) => (
                <tr key={row.status}>
                  <td><StatusBadge status={mapStatus(row.status)} /></td>
                  <td>{formatNumber(row.count)}</td>
                </tr>
              ))}
              {(data.paymentsByStatus || []).length === 0 && (
                <tr><td colSpan={2} style={{ textAlign: 'center', color: '#6B7280' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="card-title">Opérations par statut</h2>
          <table className="dashboard-mini-table">
            <thead>
              <tr><th>Statut</th><th>Nombre</th></tr>
            </thead>
            <tbody>
              {(data.operationsByStatus || []).map((row) => (
                <tr key={row.status}>
                  <td><StatusBadge status={mapStatus(row.status)} /></td>
                  <td>{formatNumber(row.count)}</td>
                </tr>
              ))}
              {(data.operationsByStatus || []).length === 0 && (
                <tr><td colSpan={2} style={{ textAlign: 'center', color: '#6B7280' }}>Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {analytics && (
        <>
          <div className="card" style={{ marginBottom: 16, padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Période d'analyse :</span>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${period === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Répartition actuelle des bénéficiaires actifs par région</h2>
            {analytics.beneficiariesByRegion.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>Aucune donnée géographique disponible.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.beneficiariesByRegion.length * 40)}>
                <BarChart data={analytics.beneficiariesByRegion} layout="vertical" margin={{ left: 20, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                  <YAxis type="category" dataKey="regionName" width={160} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatNumber(v), 'Bénéficiaires actifs']} />
                  <Bar dataKey="activeBeneficiaries" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Montants distribués par région — {analytics.period.label}</h2>
            {analytics.paymentsByRegion.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>Aucun paiement effectué sur cette période.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, analytics.paymentsByRegion.length * 40)}>
                <BarChart
                  data={analytics.paymentsByRegion.map((r) => ({ ...r, amount: safeChartNumber(r.totalAmountPaid) }))}
                  layout="vertical"
                  margin={{ left: 20, right: 30, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatTooltipMRU(v)} />
                  <YAxis type="category" dataKey="regionName" width={160} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [formatTooltipMRU(v), 'Montant distribué']} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Évolution mensuelle des montants distribués — {analytics.period.label}</h2>
            {analytics.paymentsByMonth.every((m) => m.paidPayments === 0) ? (
              <p style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>Aucun paiement effectué sur cette période.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={analytics.paymentsByMonth.map((m) => ({ ...m, amount: safeChartNumber(m.totalAmountPaid), label: formatMonthLabel(m.month) }))}
                  margin={{ left: 20, right: 30, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatTooltipMRU(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [formatTooltipMRU(v), 'Montant distribué']} />
                  <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h2 className="card-title">Détail mensuel — {analytics.period.label}</h2>
            <table className="dashboard-mini-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Paiements effectués</th>
                  <th>Montant distribué</th>
                </tr>
              </thead>
              <tbody>
                {analytics.paymentsByMonth.map((m) => (
                  <tr key={m.month}>
                    <td>{formatMonthLabel(m.month)}</td>
                    <td>{formatNumber(m.paidPayments)}</td>
                    <td>{formatAmountString(m.totalAmountPaid)}</td>
                  </tr>
                ))}
                {analytics.paymentsByMonth.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#6B7280' }}>Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <h2 className="card-title" style={{ padding: '20px 20px 0' }}>
          Opérations de paiement récentes
        </h2>
        <div style={{ padding: 20 }}>
          <DataTable columns={operationColumns} data={data.operationsRecent || []} />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="card-title">Anomalies récentes</h2>
          {recentAnomalies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>Aucune anomalie récente.</p>
          ) : (
            <table className="dashboard-mini-table">
              <thead>
                <tr><th>Type</th><th>Sévérité</th><th>Statut</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentAnomalies.map((a) => (
                  <tr key={a.id}>
                    <td>{mapAnomalyType(a.type)}</td>
                    <td><StatusBadge status={mapStatus(a.severity)} /></td>
                    <td><StatusBadge status={mapStatus(a.status)} /></td>
                    <td>{a.detectedAt ? new Date(a.detectedAt).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link to="/anomalies" className="btn btn-secondary btn-sm">Voir toutes les anomalies</Link>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Actions d'audit récentes</h2>
          {recentAuditActions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>Aucune action récente.</p>
          ) : (
            <table className="dashboard-mini-table">
              <thead>
                <tr><th>Action</th><th>Utilisateur</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentAuditActions.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatActionLabel(entry.action)}</td>
                    <td>{entry.actor?.fullName || 'Système'}</td>
                    <td>{new Date(entry.createdAt).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Link to="/audit" className="btn btn-secondary btn-sm">Voir le journal complet</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
