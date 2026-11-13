import { Card } from './Card';

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-lime-300' }) {
  return (
    <Card className="p-4 sm:p-5 min-h-[104px]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">{label}</p>
          <p className="stat-value font-extrabold mt-1.5 gradient-text truncate">{value ?? 0}</p>
          {sub && <p className="text-[11px] text-muted mt-0.5 truncate">{sub}</p>}
        </div>
        {Icon && <div className="glow-icon shrink-0 !p-2.5"><Icon size={18} /></div>}
      </div>
    </Card>
  );
}
