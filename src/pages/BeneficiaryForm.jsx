import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { createBeneficiary, updateBeneficiary, getBeneficiary } from '../services/beneficiariesService';
import { listLocalities } from '../services/geographyService';
import './BeneficiaryForm.css';

const STATUSES = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'UNDER_REVIEW', label: 'En révision' },
];

const GENDERS = [
  { value: '', label: '— Non spécifié —' },
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
];

const EMPTY_FORM = {
  fullName: '',
  nni: '',
  gender: '',
  localityId: '',
  status: 'ACTIVE',
  source: '',
  notes: '',
  primaryPhone: '',
  contactOwnerName: '',
};

function BeneficiaryForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [localities, setLocalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const locs = await listLocalities();
        if (cancelled) return;
        setLocalities(locs);

        if (isEdit) {
          const ben = await getBeneficiary(id);
          if (cancelled) return;
          setForm({
            fullName: ben.fullName || '',
            nni: ben.nni || '',
            gender: ben.gender || '',
            localityId: ben.locality?.id || '',
            status: ben.status || 'ACTIVE',
            source: ben.source || '',
            notes: ben.notes || '',
            primaryPhone: ben.primaryContact?.phone || '',
            contactOwnerName: ben.primaryContact?.ownerName || '',
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
    if (!form.fullName.trim()) errs.fullName = 'Le nom complet est obligatoire.';
    if (!form.localityId) errs.localityId = 'La localité est obligatoire.';
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
      fullName: form.fullName.trim(),
      localityId: form.localityId,
    };

    if (form.nni.trim()) payload.nni = form.nni.trim();
    if (form.gender) payload.gender = form.gender;
    if (form.status) payload.status = form.status;
    if (form.source.trim()) payload.source = form.source.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();

    if (form.primaryPhone.trim()) {
      payload.primaryContact = { phone: form.primaryPhone.trim() };
      if (form.contactOwnerName.trim()) {
        payload.primaryContact.ownerName = form.contactOwnerName.trim();
      }
    }

    setSubmitting(true);
    try {
      let result;
      if (isEdit) {
        result = await updateBeneficiary(id, payload);
      } else {
        result = await createBeneficiary(payload);
      }
      navigate(`/beneficiaires/${result.id}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Chargement du formulaire..." />;
  if (error && !form.fullName && !isEdit) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
        subtitle={isEdit ? 'Modification des données du bénéficiaire' : "Enregistrement d'un nouveau bénéficiaire dans le registre social"}
        actions={
          <Link to={isEdit ? `/beneficiaires/${id}` : '/beneficiaires'} className="btn btn-secondary">
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
            <label className="form-label">Nom complet <span className="form-required">*</span></label>
            <input
              type="text"
              className={`form-input ${fieldErrors.fullName ? 'form-input-error' : ''}`}
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Prénom et nom"
            />
            {fieldErrors.fullName && <span className="form-field-error">{fieldErrors.fullName}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">NNI</label>
            <input
              type="text"
              className="form-input"
              value={form.nni}
              onChange={(e) => handleChange('nni', e.target.value)}
              placeholder="Numéro national d'identité"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Genre</label>
            <select className="form-input" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Localité <span className="form-required">*</span></label>
            <select
              className={`form-input ${fieldErrors.localityId ? 'form-input-error' : ''}`}
              value={form.localityId}
              onChange={(e) => handleChange('localityId', e.target.value)}
            >
              <option value="">— Sélectionner une localité —</option>
              {localities.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.label}</option>
              ))}
            </select>
            {fieldErrors.localityId && <span className="form-field-error">{fieldErrors.localityId}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Source</label>
            <input
              type="text"
              className="form-input"
              value={form.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="ex: registre-national, terrain"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Téléphone principal</label>
            <input
              type="text"
              className="form-input"
              value={form.primaryPhone}
              onChange={(e) => handleChange('primaryPhone', e.target.value)}
              placeholder="+222 XX XX XX XX"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Propriétaire du contact</label>
            <input
              type="text"
              className="form-input"
              value={form.contactOwnerName}
              onChange={(e) => handleChange('contactOwnerName', e.target.value)}
              placeholder="Nom du propriétaire du téléphone"
            />
          </div>

          <div className="form-field form-field-full">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input form-textarea"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes ou observations"
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <Link to={isEdit ? `/beneficiaires/${id}` : '/beneficiaires'} className="btn btn-secondary">
            Annuler
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={16} />
            {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Créer le bénéficiaire'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BeneficiaryForm;
