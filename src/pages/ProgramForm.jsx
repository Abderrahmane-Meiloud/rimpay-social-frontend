import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { createProgram, updateProgram, getProgram } from '../services/programsService';
import './BeneficiaryForm.css';

const STATUSES = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'CLOSED', label: 'Clôturé' },
];

const EMPTY_FORM = {
  name: '',
  code: '',
  type: '',
  institution: '',
  description: '',
  startDate: '',
  endDate: '',
  budgetAmount: '',
  status: 'DRAFT',
};

function ProgramForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const prog = await getProgram(id);
        if (cancelled) return;
        setForm({
          name: prog.name || '',
          code: prog.code || '',
          type: prog.type || '',
          institution: prog.institution || '',
          description: prog.description || '',
          startDate: prog.startDate ? prog.startDate.slice(0, 10) : '',
          endDate: prog.endDate ? prog.endDate.slice(0, 10) : '',
          budgetAmount: prog.budgetAmount || '',
          status: prog.status || 'DRAFT',
        });
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
    if (!form.name.trim()) errs.name = 'Le nom est obligatoire.';
    if (!form.code.trim()) errs.code = 'Le code est obligatoire.';
    if (!form.startDate) errs.startDate = 'La date de début est obligatoire.';
    if (!form.endDate) errs.endDate = 'La date de fin est obligatoire.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
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
      code: form.code.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    };
    if (form.type.trim()) payload.type = form.type.trim();
    if (form.institution.trim()) payload.institution = form.institution.trim();
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.budgetAmount.toString().trim()) payload.budgetAmount = form.budgetAmount.toString().trim();

    setSubmitting(true);
    try {
      const result = isEdit ? await updateProgram(id, payload) : await createProgram(payload);
      navigate(`/programmes`, { state: { focusProgramId: result.id } });
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Chargement du formulaire..." />;
  if (error && isEdit && !form.name) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le programme' : 'Nouveau programme social'}
        subtitle={isEdit ? 'Modification des informations du programme' : 'Création d\'un nouveau programme de protection sociale'}
        actions={
          <Link to="/programmes" className="btn btn-secondary">
            <ArrowLeft size={16} /> Annuler
          </Link>
        }
      />

      {error && <div className="form-error-banner">{error}</div>}

      <form className="card beneficiary-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Nom <span className="form-required">*</span></label>
            <input
              type="text"
              className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nom du programme"
            />
            {fieldErrors.name && <span className="form-field-error">{fieldErrors.name}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Code <span className="form-required">*</span></label>
            <input
              type="text"
              className={`form-input ${fieldErrors.code ? 'form-input-error' : ''}`}
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Code unique, ex: PNS-2026"
              disabled={isEdit}
            />
            {fieldErrors.code && <span className="form-field-error">{fieldErrors.code}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Type</label>
            <input
              type="text"
              className="form-input"
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              placeholder="ex: CASH_TRANSFER"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Institution</label>
            <input
              type="text"
              className="form-input"
              value={form.institution}
              onChange={(e) => handleChange('institution', e.target.value)}
              placeholder="ex: Ministère des Affaires Sociales"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Date de début <span className="form-required">*</span></label>
            <input
              type="date"
              className={`form-input ${fieldErrors.startDate ? 'form-input-error' : ''}`}
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
            {fieldErrors.startDate && <span className="form-field-error">{fieldErrors.startDate}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Date de fin <span className="form-required">*</span></label>
            <input
              type="date"
              className={`form-input ${fieldErrors.endDate ? 'form-input-error' : ''}`}
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
            {fieldErrors.endDate && <span className="form-field-error">{fieldErrors.endDate}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Budget prévu</label>
            <input
              type="text"
              className="form-input"
              value={form.budgetAmount}
              onChange={(e) => handleChange('budgetAmount', e.target.value)}
              placeholder="ex: 15000000.00"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-field form-field-full">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du programme"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link to="/programmes" className="btn btn-secondary">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={16} />
            {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le programme'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProgramForm;
