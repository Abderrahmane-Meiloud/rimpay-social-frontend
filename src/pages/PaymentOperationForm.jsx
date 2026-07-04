import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { createOperation, updateOperation, getOperation } from '../services/operationsService';
import { listPrograms } from '../services/programsService';
import { listRegions } from '../services/geographyService';
import './BeneficiaryForm.css';

const EMPTY_FORM = {
  socialProgramId: '',
  name: '',
  code: '',
  period: '',
  regionId: '',
  plannedAmount: '',
  startDate: '',
  endDate: '',
};

function PaymentOperationForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [programs, setPrograms] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [progsResp, regsResp] = await Promise.all([
          listPrograms({ limit: 100 }),
          listRegions(),
        ]);
        if (cancelled) return;
        setPrograms(progsResp.data || []);
        setRegions(regsResp);

        if (isEdit) {
          const op = await getOperation(id);
          if (cancelled) return;
          setForm({
            socialProgramId: op.socialProgram?.id || '',
            name: op.name || '',
            code: op.code || '',
            period: op.period || '',
            regionId: op.scope?.region?.id || '',
            plannedAmount: op.plannedAmount || '',
            startDate: op.startDate ? op.startDate.slice(0, 10) : '',
            endDate: op.endDate ? op.endDate.slice(0, 10) : '',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom de l'opération est obligatoire.";
    if (!form.socialProgramId) errs.socialProgramId = 'Le programme social est obligatoire.';
    if (!isEdit && !form.code.trim()) errs.code = "Le code opération est obligatoire.";
    if (form.plannedAmount && (isNaN(Number(form.plannedAmount)) || Number(form.plannedAmount) <= 0)) {
      errs.plannedAmount = 'Le montant doit être un nombre positif.';
    }
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      errs.endDate = 'La date de fin doit être postérieure à la date de début.';
    }
    return errs;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const payload = {
      name: form.name.trim(),
    };

    if (!isEdit) {
      payload.socialProgramId = form.socialProgramId;
      payload.code = form.code.trim();
    }

    if (form.period.trim()) payload.period = form.period.trim();
    if (form.regionId) payload.regionId = form.regionId;
    if (form.plannedAmount) payload.plannedAmount = form.plannedAmount;
    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;

    setSubmitting(true);
    try {
      let result;
      if (isEdit) {
        result = await updateOperation(id, payload);
      } else {
        result = await createOperation(payload);
      }
      navigate(`/operations/${result.id}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Chargement du formulaire..." />;
  if (error && !form.name && !isEdit) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Modifier l'opération" : 'Nouvelle opération de paiement'}
        subtitle={isEdit ? "Modification des métadonnées de l'opération" : "Création d'une nouvelle opération de paiement"}
        actions={
          <Link to={isEdit ? `/operations/${id}` : '/operations'} className="btn btn-secondary">
            <ArrowLeft size={16} /> Annuler
          </Link>
        }
      />

      {error && (
        <div className="form-error-banner">
          {error}
        </div>
      )}

      <form className="card beneficiary-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Programme social <span className="form-required">*</span></label>
            <select
              className={`form-input ${fieldErrors.socialProgramId ? 'form-input-error' : ''}`}
              value={form.socialProgramId}
              onChange={(e) => handleChange('socialProgramId', e.target.value)}
              disabled={isEdit}
            >
              <option value="">— Sélectionner un programme —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
            {fieldErrors.socialProgramId && <span className="form-field-error">{fieldErrors.socialProgramId}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Nom de l'opération <span className="form-required">*</span></label>
            <input
              type="text"
              className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nom descriptif de l'opération"
            />
            {fieldErrors.name && <span className="form-field-error">{fieldErrors.name}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Code opération {!isEdit && <span className="form-required">*</span>}</label>
            <input
              type="text"
              className={`form-input ${fieldErrors.code ? 'form-input-error' : ''}`}
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="ex: OP-2026-S1-BRK"
              disabled={isEdit}
            />
            {fieldErrors.code && <span className="form-field-error">{fieldErrors.code}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Période</label>
            <input
              type="text"
              className="form-input"
              value={form.period}
              onChange={(e) => handleChange('period', e.target.value)}
              placeholder="ex: 2026-S1, T1-2026"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Région</label>
            <select
              className="form-input"
              value={form.regionId}
              onChange={(e) => handleChange('regionId', e.target.value)}
            >
              <option value="">— National (toutes régions) —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Montant prévu (MRU)</label>
            <input
              type="text"
              className={`form-input ${fieldErrors.plannedAmount ? 'form-input-error' : ''}`}
              value={form.plannedAmount}
              onChange={(e) => handleChange('plannedAmount', e.target.value)}
              placeholder="ex: 500000.00"
            />
            {fieldErrors.plannedAmount && <span className="form-field-error">{fieldErrors.plannedAmount}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Date de début</label>
            <input
              type="date"
              className="form-input"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Date de fin</label>
            <input
              type="date"
              className={`form-input ${fieldErrors.endDate ? 'form-input-error' : ''}`}
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
            {fieldErrors.endDate && <span className="form-field-error">{fieldErrors.endDate}</span>}
          </div>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/operations/${id}` : '/operations'} className="btn btn-secondary">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={16} />
            {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : "Créer l'opération"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentOperationForm;
