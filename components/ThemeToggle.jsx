'use client';

import { useState } from 'react';

const KEY = 'sijumantik-theme';

export function ThemeToggle() {
  const [light, setLight] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
  );

  const toggle = () => {
    const next = light ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    setLight(!light);
  };

  return (
    <div className="theme-toggle" title={light ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'}>
      <input
        type="checkbox"
        id="theme-toggle-cb"
        checked={light}
        onChange={toggle}
        aria-label="Ganti mode terang/gelap"
        suppressHydrationWarning
      />
      <label htmlFor="theme-toggle-cb" className="theme-toggle-label" />
    </div>
  );
}
