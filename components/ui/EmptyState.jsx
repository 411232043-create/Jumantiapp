import { Inbox } from 'lucide-react';

export function EmptyState({ title = 'Belum ada data', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2 text-center">
      <div className="glow-icon"><Inbox size={26} /></div>
      <p className="font-semibold mt-2">{title}</p>
      {message && <p className="text-sm text-muted max-w-sm">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
