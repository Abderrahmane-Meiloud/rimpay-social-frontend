import { Inbox } from 'lucide-react';

function EmptyState({ message = 'Aucune donnée disponible.' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
      <Inbox size={28} style={{ marginBottom: 8 }} />
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
