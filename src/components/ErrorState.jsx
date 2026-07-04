import { AlertTriangle } from 'lucide-react';

function ErrorState({ message = 'Une erreur est survenue.', onRetry }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48, color: '#B91C1C' }}>
      <AlertTriangle size={28} style={{ marginBottom: 8 }} />
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: 12 }}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export default ErrorState;
