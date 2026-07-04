import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GovernmentLogo from '../components/GovernmentLogo';
import './Login.css';

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <GovernmentLogo size={64} />
        <h1 className="login-title">PNRSCS</h1>
        <p className="login-subtitle">Plateforme de Paiement Social</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Identifiant
            <input
              type="email"
              className="login-input"
              placeholder="Adresse e-mail institutionnelle"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="login-label">
            Mot de passe
            <input
              type="password"
              className="login-input"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="login-footer">&copy; 2026 — PNRSCS</p>
      </div>
    </div>
  );
}

export default Login;
