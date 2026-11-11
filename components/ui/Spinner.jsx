export function Spinner({ size = 20, className = '' }) {
  return (
    <span className={`inline-block animate-spin rounded-full border-2 border-emerald-500/30 border-t-lime-300 ${className}`}
      style={{ width: size, height: size }} />
  );
}

export function PageLoader({ text = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner size={30} />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
