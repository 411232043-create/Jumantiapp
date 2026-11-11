export function Badge({ children, variant = 'badge-draft' }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
