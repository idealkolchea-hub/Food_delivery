export function Badge({ children, className = '' }) {
  return (
    <span className={`bb-chip ${className}`}>
      {children}
    </span>
  );
}
