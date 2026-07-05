import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, X, KeyRound, Settings2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useApi } from '../hooks/useApi';
import {
  listUsers,
  createProgrammeUser,
  createOperatorUser,
  updateUserStatus,
  resetUserPassword,
  updateProgrammeScopes,
  updateOperatorScope,
} from '../services/usersService';
import { listPrograms } from '../services/programsService';
import { listOperators } from '../services/operatorsService';
import { mapStatus } from '../utils/statusMap';
import './Users.css';

const ROLE_LABELS = {
  ADMIN_TAAZOUR: 'Administration TAAZOUR',
  PROGRAMME: 'Programme',
  OPERATOR: 'Opérateur',
};

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const EMPTY_PROGRAMME_FORM = { email: '', fullName: '', password: '', socialProgramIds: [] };
const EMPTY_OPERATOR_FORM = { email: '', fullName: '', password: '', operatorId: '' };

function Users() {
  const location = useLocation();
  const preselect = location.state || {};

  const { data, loading, error, reload } = useApi(() => listUsers({ limit: 100 }), []);
  const { data: programsData } = useApi(() => listPrograms({ limit: 100 }), []);
  const { data: operatorsData } = useApi(() => listOperators({ limit: 100, status: 'ACTIVE' }), []);

  const programs = programsData?.data || [];
  const activeOperators = operatorsData?.data || [];

  const [activeForm, setActiveForm] = useState(
    preselect.createAccountFor === 'programme'
      ? 'programme'
      : preselect.createAccountFor === 'operator'
        ? 'operator'
        : null,
  );
  const [programmeForm, setProgrammeForm] = useState(
    preselect.createAccountFor === 'programme' && preselect.programId
      ? { ...EMPTY_PROGRAMME_FORM, socialProgramIds: [preselect.programId] }
      : EMPTY_PROGRAMME_FORM,
  );
  const [operatorForm, setOperatorForm] = useState(
    preselect.createAccountFor === 'operator' && preselect.operatorId
      ? { ...EMPTY_OPERATOR_FORM, operatorId: preselect.operatorId }
      : EMPTY_OPERATOR_FORM,
  );

  useEffect(() => {
    // Clear the navigation state after consuming it once, so returning to
    // this page later (e.g. via the sidebar) doesn't keep reopening the
    // pre-filled form.
    if (preselect.createAccountFor) {
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [passwordTargetId, setPasswordTargetId] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccessId, setPasswordSuccessId] = useState(null);

  const [scopeTargetId, setScopeTargetId] = useState(null);
  const [scopeProgrammeIds, setScopeProgrammeIds] = useState([]);
  const [scopeOperatorId, setScopeOperatorId] = useState('');
  const [scopeSubmitting, setScopeSubmitting] = useState(false);
  const [scopeError, setScopeError] = useState('');

  function toggleProgrammeSelection(id) {
    setProgrammeForm((prev) => {
      const has = prev.socialProgramIds.includes(id);
      return {
        ...prev,
        socialProgramIds: has
          ? prev.socialProgramIds.filter((p) => p !== id)
          : [...prev.socialProgramIds, id],
      };
    });
  }

  function toggleScopeProgrammeSelection(id) {
    setScopeProgrammeIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleCreateProgramme(e) {
    e.preventDefault();
    setFormError('');

    if (!programmeForm.email.trim() || !programmeForm.fullName.trim() || !programmeForm.password) {
      setFormError('Email, nom complet et mot de passe initial sont obligatoires.');
      return;
    }
    if (programmeForm.password.length < 12) {
      setFormError('Le mot de passe initial doit contenir au moins 12 caractères.');
      return;
    }
    if (programmeForm.socialProgramIds.length === 0) {
      setFormError('Sélectionnez au moins un programme.');
      return;
    }

    setSubmitting(true);
    try {
      await createProgrammeUser({
        email: programmeForm.email.trim(),
        fullName: programmeForm.fullName.trim(),
        password: programmeForm.password,
        socialProgramIds: programmeForm.socialProgramIds,
      });
      setProgrammeForm(EMPTY_PROGRAMME_FORM);
      setActiveForm(null);
      reload();
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la création du compte programme');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateOperator(e) {
    e.preventDefault();
    setFormError('');

    if (!operatorForm.email.trim() || !operatorForm.fullName.trim() || !operatorForm.password) {
      setFormError('Email, nom complet et mot de passe initial sont obligatoires.');
      return;
    }
    if (operatorForm.password.length < 12) {
      setFormError('Le mot de passe initial doit contenir au moins 12 caractères.');
      return;
    }
    if (!operatorForm.operatorId) {
      setFormError('Sélectionnez un opérateur actif.');
      return;
    }

    setSubmitting(true);
    try {
      await createOperatorUser({
        email: operatorForm.email.trim(),
        fullName: operatorForm.fullName.trim(),
        password: operatorForm.password,
        operatorId: operatorForm.operatorId,
      });
      setOperatorForm(EMPTY_OPERATOR_FORM);
      setActiveForm(null);
      reload();
    } catch (err) {
      setFormError(err.message || "Erreur lors de la création du compte opérateur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(user, status) {
    setActionError('');
    setStatusUpdatingId(user.id);
    try {
      await updateUserStatus(user.id, status);
      reload();
    } catch (err) {
      setActionError(err.message || 'Erreur lors du changement de statut');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function openPasswordReset(user) {
    setPasswordTargetId(user.id);
    setPasswordValue('');
    setPasswordConfirm('');
    setPasswordError('');
    setPasswordSuccessId(null);
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setPasswordError('');

    if (passwordValue.length < 12) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (passwordValue !== passwordConfirm) {
      setPasswordError('La confirmation ne correspond pas au mot de passe saisi.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      // The password is sent once to the backend and never re-displayed,
      // logged, or stored client-side (not even transiently in
      // localStorage/sessionStorage) — cleared from state immediately.
      await resetUserPassword(passwordTargetId, passwordValue);
      setPasswordSuccessId(passwordTargetId);
      setPasswordValue('');
      setPasswordConfirm('');
      setPasswordTargetId(null);
    } catch (err) {
      setPasswordError(err.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setPasswordSubmitting(false);
    }
  }

  function openScopeEditor(user) {
    setScopeTargetId(user.id);
    setScopeProgrammeIds(user.programmeIds || []);
    setScopeOperatorId(user.operatorId || '');
    setScopeError('');
  }

  async function handleScopeSave(user) {
    setScopeError('');
    setScopeSubmitting(true);
    try {
      if (user.roles.includes('PROGRAMME')) {
        if (scopeProgrammeIds.length === 0) {
          setScopeError('Sélectionnez au moins un programme.');
          setScopeSubmitting(false);
          return;
        }
        await updateProgrammeScopes(user.id, scopeProgrammeIds);
      } else if (user.roles.includes('OPERATOR')) {
        if (!scopeOperatorId) {
          setScopeError('Sélectionnez un opérateur actif.');
          setScopeSubmitting(false);
          return;
        }
        await updateOperatorScope(user.id, scopeOperatorId);
      }
      setScopeTargetId(null);
      reload();
    } catch (err) {
      setScopeError(err.message || 'Erreur lors de la mise à jour du périmètre');
    } finally {
      setScopeSubmitting(false);
    }
  }

  const columns = [
    { key: 'fullName', header: 'Nom complet' },
    { key: 'email', header: 'Email' },
    {
      key: 'roles',
      header: 'Rôle',
      render: (row) => row.roles.map((r) => ROLE_LABELS[r] || r).join(', '),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (row) => <StatusBadge status={mapStatus(row.status)} />,
    },
    {
      key: 'scope',
      header: 'Périmètre',
      render: (row) => {
        if (row.roles.includes('PROGRAMME')) {
          const names = (row.programmeIds || [])
            .map((id) => programs.find((p) => p.id === id)?.name || id)
            .join(', ');
          return names || '—';
        }
        if (row.roles.includes('OPERATOR')) {
          const op = activeOperators.find((o) => o.id === row.operatorId);
          return op ? op.name : row.operatorId || '—';
        }
        return '—';
      },
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.filter((s) => s !== row.status).map((s) => (
            <button
              key={s}
              className="btn btn-secondary btn-sm"
              disabled={statusUpdatingId === row.id}
              onClick={() => handleStatusChange(row, s)}
            >
              {s === 'ACTIVE' ? 'Activer' : s === 'INACTIVE' ? 'Désactiver' : 'Suspendre'}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={() => openPasswordReset(row)}>
            <KeyRound size={14} /> Mot de passe
          </button>
          {(row.roles.includes('PROGRAMME') || row.roles.includes('OPERATOR')) && (
            <button className="btn btn-secondary btn-sm" onClick={() => openScopeEditor(row)}>
              <Settings2 size={14} /> Périmètre
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="Chargement des comptes..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const users = data?.data || [];
  const scopeTargetUser = users.find((u) => u.id === scopeTargetId);

  return (
    <div>
      <PageHeader
        title="Comptes utilisateurs"
        subtitle="Création et gestion des comptes PROGRAMME et OPERATOR — réservé à l'administration TAAZOUR"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => { setActiveForm(activeForm === 'programme' ? null : 'programme'); setFormError(''); }}
            >
              {activeForm === 'programme' ? <X size={16} /> : <Plus size={16} />}
              Compte programme
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setActiveForm(activeForm === 'operator' ? null : 'operator'); setFormError(''); }}
            >
              {activeForm === 'operator' ? <X size={16} /> : <Plus size={16} />}
              Compte opérateur
            </button>
          </div>
        }
      />

      {actionError && <div className="form-error-banner">{actionError}</div>}

      {passwordSuccessId && (
        <div className="users-success-banner">Mot de passe mis à jour avec succès.</div>
      )}

      {activeForm === 'programme' && (
        <form className="card users-form" onSubmit={handleCreateProgramme} style={{ marginBottom: 16 }}>
          <h2 className="card-title">Créer un compte programme</h2>
          {formError && <div className="form-error-banner">{formError}</div>}
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Email <span className="form-required">*</span></label>
              <input
                type="email"
                className="form-input"
                value={programmeForm.email}
                onChange={(e) => setProgrammeForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="responsable.programme@taazor.mr"
                autoComplete="off"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nom complet <span className="form-required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={programmeForm.fullName}
                onChange={(e) => setProgrammeForm((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Mot de passe initial <span className="form-required">*</span></label>
              <input
                type="password"
                className="form-input"
                value={programmeForm.password}
                onChange={(e) => setProgrammeForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="12 caractères minimum"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="form-field form-field-full">
            <label className="form-label">Programme(s) <span className="form-required">*</span></label>
            <div className="users-scope-list">
              {programs.length === 0 ? (
                <span className="users-scope-empty">Aucun programme disponible.</span>
              ) : (
                programs.map((p) => (
                  <label key={p.id} className="users-scope-item">
                    <input
                      type="checkbox"
                      checked={programmeForm.socialProgramIds.includes(p.id)}
                      onChange={() => toggleProgrammeSelection(p.id)}
                    />
                    {p.name} ({p.code})
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Création...' : 'Créer le compte programme'}
            </button>
          </div>
        </form>
      )}

      {activeForm === 'operator' && (
        <form className="card users-form" onSubmit={handleCreateOperator} style={{ marginBottom: 16 }}>
          <h2 className="card-title">Créer un compte opérateur</h2>
          {formError && <div className="form-error-banner">{formError}</div>}
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Email <span className="form-required">*</span></label>
              <input
                type="email"
                className="form-input"
                value={operatorForm.email}
                onChange={(e) => setOperatorForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="responsable.operateur@taazor.mr"
                autoComplete="off"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nom complet <span className="form-required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={operatorForm.fullName}
                onChange={(e) => setOperatorForm((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Mot de passe initial <span className="form-required">*</span></label>
              <input
                type="password"
                className="form-input"
                value={operatorForm.password}
                onChange={(e) => setOperatorForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="12 caractères minimum"
                autoComplete="new-password"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Opérateur actif <span className="form-required">*</span></label>
              <select
                className="form-input"
                value={operatorForm.operatorId}
                onChange={(e) => setOperatorForm((p) => ({ ...p, operatorId: e.target.value }))}
              >
                <option value="">— Sélectionner un opérateur actif —</option>
                {activeOperators.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Création...' : 'Créer le compte opérateur'}
            </button>
          </div>
        </form>
      )}

      {passwordTargetId && (
        <form className="card users-form" onSubmit={handlePasswordReset} style={{ marginBottom: 16 }}>
          <h2 className="card-title">Réinitialiser le mot de passe</h2>
          {passwordError && <div className="form-error-banner">{passwordError}</div>}
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Nouveau mot de passe <span className="form-required">*</span></label>
              <input
                type="password"
                className="form-input"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="12 caractères minimum"
                autoComplete="new-password"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Confirmer le mot de passe <span className="form-required">*</span></label>
              <input
                type="password"
                className="form-input"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setPasswordTargetId(null)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={passwordSubmitting}>
              {passwordSubmitting ? 'Enregistrement...' : 'Réinitialiser'}
            </button>
          </div>
        </form>
      )}

      {scopeTargetId && scopeTargetUser && (
        <div className="card users-form" style={{ marginBottom: 16 }}>
          <h2 className="card-title">Modifier le périmètre — {scopeTargetUser.fullName}</h2>
          {scopeError && <div className="form-error-banner">{scopeError}</div>}

          {scopeTargetUser.roles.includes('PROGRAMME') && (
            <div className="form-field form-field-full">
              <label className="form-label">Programme(s)</label>
              <div className="users-scope-list">
                {programs.map((p) => (
                  <label key={p.id} className="users-scope-item">
                    <input
                      type="checkbox"
                      checked={scopeProgrammeIds.includes(p.id)}
                      onChange={() => toggleScopeProgrammeSelection(p.id)}
                    />
                    {p.name} ({p.code})
                  </label>
                ))}
              </div>
            </div>
          )}

          {scopeTargetUser.roles.includes('OPERATOR') && (
            <div className="form-field">
              <label className="form-label">Opérateur actif</label>
              <select
                className="form-input"
                value={scopeOperatorId}
                onChange={(e) => setScopeOperatorId(e.target.value)}
              >
                <option value="">— Sélectionner un opérateur actif —</option>
                {activeOperators.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setScopeTargetId(null)}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={scopeSubmitting}
              onClick={() => handleScopeSave(scopeTargetUser)}
            >
              {scopeSubmitting ? 'Enregistrement...' : 'Enregistrer le périmètre'}
            </button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState message="Aucun compte utilisateur enregistré." />
      ) : (
        <DataTable columns={columns} data={users} />
      )}
    </div>
  );
}

export default Users;
