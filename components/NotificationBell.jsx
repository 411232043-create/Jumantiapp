'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { listNotifikasi, tandaiNotifikasiDibaca } from '@/services/firestore';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function NotificationBell({ user }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.uid) listNotifikasi(user.uid).then(setItems).catch(() => {});
  }, [user?.uid, open]);

  const unread = items.filter((n) => !n.dibaca).length;

  const openNotif = async (n) => {
    if (!n.dibaca) await tandaiNotifikasiDibaca(n.id).catch(() => {});
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative">
      <button className="btn btn-ghost !p-2.5 !rounded-full relative" onClick={() => setOpen(!open)}
        aria-label="Notifikasi">
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-lime-400 text-[10px] font-bold text-emerald-950 flex items-center justify-center shadow-[0_0_10px_rgba(163,230,53,.7)]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div className="glass-card absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-[85] p-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted px-3 py-2">Notifikasi</p>
            {!items.length && <p className="text-sm text-muted px-3 py-4">Belum ada notifikasi.</p>}
            {items.map((n) => (
              <button key={n.id} onClick={() => openNotif(n)}
                className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 transition ${!n.dibaca ? 'bg-emerald-500/5' : ''}`}>
                <div className="flex gap-2">
                  {!n.dibaca && <span className="w-2 h-2 rounded-full bg-lime-400 mt-1.5 shrink-0" />}
                  <div className={!n.dibaca ? '' : 'pl-4'}>
                    <p className="text-[13px] font-semibold">{n.judul}</p>
                    <p className="text-xs text-muted line-clamp-2">{n.pesan}</p>
                    <p className="text-[10px] text-muted mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
