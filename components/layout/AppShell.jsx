'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { MENUS } from '@/lib/menus';
import { ROLE_LABELS } from '@/lib/constants';
import { NotificationBell } from '@/components/NotificationBell';
import { Bug, LogOut, Menu, X } from 'lucide-react';

export function AppShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOn, setSidebarOn] = useState(true);

  const toggleNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarOn((v) => !v);
    else setMobileOpen(true);
  };
  const menus = MENUS[user.id_role] || [];

  const logout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      await signOut(auth);
    } finally {
      router.replace('/login');
    }
  };

  const isActive = (href) => {
    const base = href.split('?')[0];
    const home = `/${user.id_role === 'kepala_divisi' ? 'kepala-divisi' : user.id_role}`;
    if (base === home) return pathname === base;
    return pathname.startsWith(base);
  };

  const renderNav = (onClick) => (
    <nav className="flex flex-col gap-1 px-3">
      {menus.map((m) => (
        <Link key={m.href} href={m.href} onClick={onClick}
          className={`side-link ${isActive(m.href) ? 'active' : ''}`}>
          <m.icon size={17} />
          <span>{m.label}</span>
        </Link>
      ))}
      <button onClick={logout} className="side-link text-left mt-2 !text-rose-300/80 hover:!text-rose-200">
        <LogOut size={17} />
        <span>Logout</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <div className="app-bg" />
      <div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" />

      {/* Sidebar desktop */}
      <aside className={`${sidebarOn ? 'hidden lg:flex' : 'hidden'} flex-col fixed inset-y-0 left-0 w-64 z-40 sidebar-glass`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b divider">
          <div className="glow-icon !rounded-xl"><Bug size={20} /></div>
          <div>
            <p className="font-extrabold text-sm gradient-text">SI-JUMANTIK</p>
            <p className="text-[10px] text-muted">Pemantauan Jentik Nyamuk</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          {renderNav()}
        </div>
        <div className="px-5 py-4 border-t divider">
          <p className="text-[13px] font-semibold truncate">{user.nama}</p>
          <p className="text-[11px] text-muted">{ROLE_LABELS[user.id_role] || user.id_role}</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col sidebar-glass">
            <div className="flex items-center justify-between px-5 h-16 border-b divider">
              <div className="flex items-center gap-3">
                <div className="glow-icon !rounded-xl"><Bug size={20} /></div>
                <p className="font-extrabold text-sm gradient-text">SI-JUMANTIK</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="btn btn-ghost !p-2"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">{renderNav(() => setMobileOpen(false))}</div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className={sidebarOn ? 'lg:pl-64' : ''}>
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-emerald-500/15"
          style={{ background: 'rgba(3,12,8,.8)', backdropFilter: 'blur(14px)' }}>
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost !p-2.5" onClick={toggleNav} aria-label="Buka/tutup menu" title="Buka/tutup menu"><Menu size={18} /></button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="glow-icon !p-2 !rounded-lg"><Bug size={16} /></div>
              <span className="font-extrabold text-sm gradient-text">SI-JUMANTIK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell user={user} />
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[13px] font-semibold leading-tight">{user.nama}</span>
              <span className="text-[10.5px] text-muted">{ROLE_LABELS[user.id_role] || user.id_role}</span>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-emerald-950 text-sm"
              style={{ background: 'linear-gradient(135deg,#a3e635,#34d399)', boxShadow: '0 0 16px rgba(163,230,53,.4)' }}>
              {(user.nama || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
