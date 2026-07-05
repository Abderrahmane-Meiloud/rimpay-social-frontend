import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { importBeneficiaries } from '../services/beneficiariesService';
import './BeneficiaryImport.css';

const PLACEHOLDER = `[
  {
    "registryCode": "BEN-001",
    "fullName": "Nom fictif",
    "nni": "1234567890",
    "phone": "+22200000000",
    "localityId": "identifiant-localite"
  }
]`;

function BeneficiaryImport() {
  const [raw, setRaw] = useState('');
  const [parseError, setParseError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  function handleChange(value) {
    setRaw(value);
    setParseError('');
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setResult(null);

    let rows;
    try {
      rows = JSON.parse(raw);
    } catch {
      setParseError('Le contenu doit être un tableau JSON valide.');
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      setParseError('Le tableau de bénéficiaires ne peut pas être vide.');
      return;
    }

    setParseError('');
    setSubmitting(true);
    try {
      // Never logged: this import call and its response never pass through
      // console.* — only the safe aggregate counts below are rendered.
      const res = await importBeneficiaries(rows);
      setResult(res);
      setRaw('');
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de l'import");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Import des bénéficiaires"
        subtitle="Import massif du registre des bénéficiaires — réservé à l'administration TAAZOUR"
        actions={
          <Link to="/beneficiaires" className="btn btn-secondary">
            <ArrowLeft size={16} /> Retour aux bénéficiaires
          </Link>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 0 }}>
          Collez un tableau JSON de bénéficiaires à importer. Les champs <code>fullName</code> et{' '}
          <code>localityId</code> sont obligatoires. Un <code>registryCode</code> ou <code>nni</code> déjà
          existant sera ignoré (aucun doublon ne sera créé). Le format fichier (CSV/Excel) sera ajouté dans une
          phase ultérieure.
        </p>
      </div>

      {submitError && (
        <div className="assign-result-banner assign-result-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} />
          {submitError}
        </div>
      )}

      {result && (
        <div className="import-result-card">
          <div className="import-result-item import-result-created">
            <CheckCircle size={18} />
            <span>{result.created} créé{result.created > 1 ? 's' : ''}</span>
          </div>
          <div className="import-result-item import-result-skipped">
            <AlertTriangle size={18} />
            <span>{result.skipped} ignoré{result.skipped > 1 ? 's' : ''} (doublon)</span>
          </div>
          <div className="import-result-item import-result-invalid">
            <AlertTriangle size={18} />
            <span>{result.invalid} invalide{result.invalid > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      <form className="card" onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="import-json">
          Contenu JSON à importer <span className="form-required">*</span>
        </label>
        <textarea
          id="import-json"
          className={`form-input form-textarea import-textarea ${parseError ? 'form-input-error' : ''}`}
          rows={14}
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
        />
        {parseError && <span className="form-field-error">{parseError}</span>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting || !raw.trim()}>
            <UploadCloud size={16} />
            {submitting ? 'Import en cours...' : 'Importer'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BeneficiaryImport;
