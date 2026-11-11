'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

export function DataTable({ columns, data, searchKeys = [], searchPlaceholder = 'Cari...', pageSize = 10, empty, filters }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter((row) => searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(s)));
  }, [data, search, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pl-9" placeholder={searchPlaceholder} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        {filters}
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="tbl min-w-[640px]">
          <thead>
            <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id || i}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (empty || <EmptyState />)}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted">
          <span>Menampilkan {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} dari {filtered.length}</span>
          <div className="flex gap-1">
            <button className="btn btn-ghost !p-2" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /></button>
            <button className="btn btn-ghost !p-2" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
