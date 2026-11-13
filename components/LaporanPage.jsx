'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/Spinner';
import { ExportButtons } from '@/components/ExportButtons';
import { MonthlyBarChart, ResultPieChart } from '@/components/Charts';
import { listPemeriksaan, listWilayah, listUsersByRole, getDocById } from '@/services/firestore';
import { where } from 'firebase/firestore';
import { STATUS, STATUS_LABELS, STATUS_BADGE, KESIMPULAN_LABELS } from '@/lib/constants';
import { formatDate, hitungABJ, toDate } from '@/lib/utils';

const PERIODE = [
  { key: 'semua', label: 'Semua' },
  { key: 'hari', label: 'Hari Ini' },
  { key: 'minggu', label: '7 Hari Terakhir' },
  { key: 'bulan', label: 'Bulan Ini' },
  { key: 'tahun', label: 'Tahun Ini' },
  { key: 'rentang', label: 'Rentang Tanggal' },
];

export function LaporanPage({ title = 'Laporan Pemeriksaan', subtitle, showKaderFilter = true }) {
  const [items, setItems] = useState(null);
  const [wilayah, setWilayah] = useState([]);
  const [kaders, setKaders] = useState([]);
  const [pengaturan, setPengaturan] = useState(null);
  const [f, setF] = useState({ periode: 'bulan', dari: '', sampai: '', id_wilayah: '', id_kader: '' });

  useEffect(() => {
    Promise.all([
      listPemeriksaan(where('status', '==', STATUS.APPROVED)),
      listWilayah(), listUsersByRole('kader'), getDocById('pengaturan', 'app'),
    ]).then(([p, w, k, s]) => { setItems(p.sort((a,b)=> (b.tanggal_pemeriksaan||'').localeCompare(a.tanggal_pemeriksaan||''))); setWilayah(w); setKaders(k); setPengaturan(s); })
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    return items.filter((p) => {
      const tgl = p.tanggal_pemeriksaan || '';
      if (f.periode === 'hari' && tgl !== today) return false;
      if (f.periode === 'minggu') {
        const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
        if (tgl < d7.toISOString().slice(0, 10)) return false;
      }
      if (f.periode === 'bulan' && tgl.slice(0, 7) !== today.slice(0, 7)) return false;
      if (f.periode === 'tahun' && tgl.slice(0, 4) !== today.slice(0, 4)) return false;
      if (f.periode === 'rentang') {
        if (f.dari && tgl < f.dari) return false;
        if (f.sampai && tgl > f.sampai) return false;
      }
      if (f.id_wilayah && p.id_wilayah !== f.id_wilayah) return false;
      if (f.id_kader && p.id_kader !== f.id_kader) return false;
      return true;
    });
  }, [items, f]);

  const stats = useMemo(() => {
    const positif = filtered.filter((p) => p.kesimpulan === 'positif_jentik').length;
    const bebas = filtered.filter((p) => p.kesimpulan === 'bebas_jentik').length;
    return { total: filtered.length, positif, bebas, abj: hitungABJ(filtered.length, bebas) };
  }, [filtered]);

  const bulanan = useMemo(() => {
    const m = {};
    for (const p of filtered) {
      const bln = (p.tanggal_pemeriksaan || '').slice(0, 7);
      if (bln) m[bln] = (m[bln] || 0) + 1;
    }
    return Object.keys(m).sort().map((k) => ({ label: k.slice(5) + '/' + k.slice(2, 4), total: m[k] }));
  }, [filtered]);

  if (!items) return <PageLoader />;

  const periodeLabel = PERIODE.find((p) => p.key === f.periode)?.label;
  const columns = [
    { key: 'tanggal_pemeriksaan', label: 'Tanggal', export: (r) => formatDate(r.tanggal_pemeriksaan) },
    { key: 'nama_wilayah', label: 'Wilayah' },
    { key: 'nama_kader', label: 'Kader' },
    { key: 'nama_warga', label: 'Pemilik Rumah' },
    { key: 'alamat_rumah', label: 'Alamat' },
    { key: 'kesimpulan', label: 'Hasil', export: (r) => KESIMPULAN_LABELS[r.kesimpulan] || '-' },
    { key: 'status', label: 'Status', export: (r) => STATUS_LABELS[r.status] },
  ];
  const headerInfo = [
    `Divisi: ${pengaturan?.nama_divisi || '-'}`,
    `Periode: ${periodeLabel}${f.periode === 'rentang' ? ` (${formatDate(f.dari)} s/d ${formatDate(f.sampai)})` : ''}`,
    `Rumah diperiksa: ${stats.total} | Positif jentik: ${stats.positif} | Bebas jentik: ${stats.bebas} | ABJ: ${stats.abj}%`,
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle || 'Laporan pemeriksaan yang telah disetujui'}
        action={<ExportButtons columns={columns} rows={filtered} title="Laporan Pemeriksaan Jentik SI-JUMANTIK"
          filename={`laporan-jumantik-${f.periode}`} headerInfo={headerInfo} />} />

      <Card className="p-5 mb-4" hover={false}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Periode">
            <select className="select" value={f.periode} onChange={(e) => setF({ ...f, periode: e.target.value })}>
              {PERIODE.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>
          {f.periode === 'rentang' && <>
            <Field label="Dari"><input type="date" className="input" value={f.dari} onChange={(e) => setF({ ...f, dari: e.target.value })} /></Field>
            <Field label="Sampai"><input type="date" className="input" value={f.sampai} onChange={(e) => setF({ ...f, sampai: e.target.value })} /></Field>
          </>}
          <Field label="Wilayah">
            <select className="select" value={f.id_wilayah} onChange={(e) => setF({ ...f, id_wilayah: e.target.value })}>
              <option value="">Semua Wilayah</option>
              {wilayah.map((w) => <option key={w.id} value={w.id}>{w.nama_wilayah}</option>)}
            </select>
          </Field>
          {showKaderFilter && (
            <Field label="Kader">
              <select className="select" value={f.id_kader} onChange={(e) => setF({ ...f, id_kader: e.target.value })}>
                <option value="">Semua Kader</option>
                {kaders.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </Field>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {[['Rumah Diperiksa', stats.total], ['Positif Jentik', stats.positif], ['Bebas Jentik', stats.bebas], ['ABJ', `${stats.abj}%`]].map(([l, v]) => (
          <Card key={l} className="p-4 text-center" hover={false}>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold">{l}</p>
            <p className="text-2xl font-extrabold gradient-text mt-1">{v}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5"><CardHeader title="Pemeriksaan per Bulan" /><MonthlyBarChart data={bulanan} /></Card>
        <Card className="p-5"><CardHeader title="Hasil Pemeriksaan" />
          <ResultPieChart data={[
            { name: 'Bebas Jentik', value: stats.bebas },
            { name: 'Positif Jentik', value: stats.positif },
          ]} /></Card>
      </div>

      <Card className="p-5" hover={false}>
        <CardHeader title="Rincian Data" subtitle={`${filtered.length} laporan disetujui`} />
        <div className="tbl-wrap overflow-x-auto mx-1 mb-2">
          <table className="tbl min-w-[800px]">
            <thead><tr><th>Tanggal</th><th>Wilayah</th><th>Kader</th><th>Pemilik Rumah</th><th>Alamat</th><th>Hasil</th></tr></thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.tanggal_pemeriksaan)}</td>
                  <td>{r.nama_wilayah}</td>
                  <td>{r.nama_kader}</td>
                  <td>{r.nama_warga}</td>
                  <td className="text-muted">{r.alamat_rumah}</td>
                  <td><Badge variant={r.kesimpulan === 'positif_jentik' ? 'badge-positif' : 'badge-bebas'}>{KESIMPULAN_LABELS[r.kesimpulan]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="text-sm text-muted text-center py-8">Tidak ada data pada filter ini.</p>}
          {filtered.length > 100 && <p className="text-xs text-muted py-2">Menampilkan 100 data pertama. Gunakan ekspor untuk seluruh data.</p>}
        </div>
      </Card>
    </div>
  );
}
