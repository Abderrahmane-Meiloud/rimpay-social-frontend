import './StatCard.css';

function StatCard({ icon: Icon, label, value, accent = 'green' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${accent}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export default StatCard;
