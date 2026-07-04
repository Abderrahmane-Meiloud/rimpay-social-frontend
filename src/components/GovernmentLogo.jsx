import './GovernmentLogo.css';

function GovernmentLogo({ size = 56 }) {
  return (
    <div className="gov-logo" style={{ width: size, height: size }}>
      <span className="gov-logo-inner">RS</span>
    </div>
  );
}

export default GovernmentLogo;
