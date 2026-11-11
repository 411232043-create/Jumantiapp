import { Card } from './Card';

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-lime-300' }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="text-3xl font-extrabold mt-2 gradient-text">{value ?? 0}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        {Icon && <div className="glow-icon"><Icon size={20} /></div>}
      </div>
    </Card>
  );
}
