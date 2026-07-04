import { useState } from 'react';
import { FileText, Table } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import { getReportCatalog, listReports, downloadPaymentSummary } from '../services/reportsService';
import { mapStatus } from '../utils/statusMap';
import './Reports.css';

const PERIOD_OPTIONS = [
  { value: 'LAST_3_MONTHS', label: '3 derniers mois' },
  { value: 'LAST_6_MONTHS', label: '6 derniers mois' },
  { value: 'LAST_12_MONTHS', label: '12 derniers mois' },
  { value: 'CURRENT_YEAR', label: 'Année en cours' },
];

const reportColumns = [
  { key: 'reportType', header: 'Type' },
  { key: 'format', header: 'Format' },
  {
    key: 'status',
    header: 'Statut',
    render: (row) => <StatusBadge status={mapStatus(row.status)} />,
  },
  {
    key: 'generatedAt',
    header: 'Généré le',
    render: (row) => row.generatedAt ? new Date(row.generatedAt).toLocaleString('fr-FR') : '—',
  },
  {
    key: 'generatedBy',
    header: 'Par',
    render: (row) => row.generatedBy?.fullName || '—',
  },
];

function Reports() {
  const catalog = useApi(() => getReportCatalog(), []);
  const reports = useApi(() => listReports({ limit: 20 }), []);

  const [exportPeriod, setExportPeriod] = useState('LAST_12_MONTHS');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleDownload = async (format) => {
    const setLoading = format === 'pdf' ? setPdfLoading : setXlsxLoading;
    setLoading(true);
    setExportError('');
    try {
      await downloadPaymentSummary(format, exportPeriod);
    } catch (err) {
      setExportError(err.message || 'Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };

  const anyLoading = catalog.loading || reports.loading;
  const anyError = catalog.error || reports.error;

  if (anyLoading) return <LoadingState message="Chargement des rapports..." />;
  if (anyError) return <ErrorState message={anyError} onRetry={() => window.location.reload()} />;

  const catalogItems = catalog.data || [];
  const generatedReports = reports.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle="Catalogue des rapports institutionnels de la plateforme"
      />

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Rapport de synthèse des paiements sociaux</h2>
        <p className="report-description">
          Synthèse des paiements effectivement effectués par période : totaux, répartition régionale et évolution mensuelle.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <label htmlFor="export-period-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
            Période :
          </label>
          <select
            id="export-period-select"
            name="period"
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {exportError && (
          <div style={{ marginBottom: 12, padding: '10px 16px', fontSize: 13, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{exportError}</span>
            <button onClick={() => setExportError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontWeight: 600, fontSize: 13 }}>✕</button>
          </div>
        )}

        <div className="report-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('pdf')}
            disabled={pdfLoading}
          >
            <FileText size={16} />
            {pdfLoading ? 'Génération du PDF...' : 'Télécharger en PDF'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('xlsx')}
            disabled={xlsxLoading}
          >
            <Table size={16} />
            {xlsxLoading ? 'Génération Excel...' : 'Télécharger en Excel'}
          </button>
        </div>
      </div>

      <div className="reports-grid">
        {catalogItems.map((item) => (
          <div className="card report-card" key={item.code}>
            <h2 className="card-title">{item.title}</h2>
            <p className="report-description">{item.description}</p>
            <div style={{ marginBottom: 8 }}>
              <StatusBadge
                status={item.status === 'AVAILABLE' ? 'actif' : 'en_attente'}
                label={item.status === 'AVAILABLE' ? 'Disponible' : 'Planifié'}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="card-title">Rapports générés</h2>
        {generatedReports.length === 0 ? (
          <EmptyState message="Aucun rapport généré pour le moment." />
        ) : (
          <DataTable columns={reportColumns} data={generatedReports} />
        )}
      </div>
    </div>
  );
}

export default Reports;
