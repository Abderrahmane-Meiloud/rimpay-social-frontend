function LoadingState({ message = 'Chargement...' }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;
