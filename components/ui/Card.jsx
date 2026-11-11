export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div className={`glass-card ${hover ? 'card-3d' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <h3 className="font-bold text-[15px]">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
